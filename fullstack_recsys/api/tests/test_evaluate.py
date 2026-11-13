"""Unit tests for recommendation ranking / scoring metrics (no live services)."""
import math
import sys
from pathlib import Path

import numpy as np
import pytest
import scipy.sparse as sp

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from recommend.evaluate import evaluate, extract_top_k


class TestExtractTopK:
    def test_returns_highest_scoring_indices_in_order(self):
        # Two users, five items
        prediction = np.array([
            [0.1, 0.9, 0.3, 0.8, 0.2],
            [0.5, 0.4, 0.7, 0.1, 0.6],
        ], dtype=np.float64)
        topk = extract_top_k(prediction, k=3)
        assert topk.shape == (2, 3)
        np.testing.assert_array_equal(topk[0], np.array([1, 3, 2]))
        np.testing.assert_array_equal(topk[1], np.array([2, 4, 0]))

    def test_k_equals_one(self):
        prediction = np.array([[1.0, 5.0, 3.0]], dtype=np.float64)
        topk = extract_top_k(prediction, k=1)
        assert topk.shape == (1, 1)
        assert int(topk[0, 0]) == 1


class TestEvaluateMetrics:
    def _csr_from_lists(self, rows, cols, shape):
        data = np.ones(len(rows), dtype=np.float64)
        return sp.csr_matrix((data, (rows, cols)), shape=shape)

    def test_perfect_ranking_scores(self):
        # One user; relevant items are 0 and 1; top-k returns exactly those first
        top_k = np.array([[0, 1, 2]], dtype=np.int64)
        test_matrix = self._csr_from_lists([0, 0], [0, 1], shape=(1, 5))
        k = 3
        scores = evaluate(top_k, test_matrix, k)

        assert scores[f'prec@{k}'] == pytest.approx(2 / 3)
        assert scores[f'recall@{k}'] == pytest.approx(1.0)

        # NDCG: hits at ranks 1 and 2
        dcg = 1 / math.log(2, 2) + 1 / math.log(3, 2)
        idcg = 1 / math.log(2, 2) + 1 / math.log(3, 2)
        assert scores[f'ndcg@{k}'] == pytest.approx(dcg / idcg)

    def test_no_hits_yields_zero_metrics(self):
        top_k = np.array([[3, 4]], dtype=np.int64)
        test_matrix = self._csr_from_lists([0], [0], shape=(1, 5))
        k = 2
        scores = evaluate(top_k, test_matrix, k)
        assert scores[f'prec@{k}'] == pytest.approx(0.0)
        assert scores[f'recall@{k}'] == pytest.approx(0.0)
        assert scores[f'ndcg@{k}'] == pytest.approx(0.0)
