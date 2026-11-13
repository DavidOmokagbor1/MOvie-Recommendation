"""Unit tests for EASE recommend / scoring path with a synthetic weight matrix."""
import sys
from pathlib import Path

import numpy as np

API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from recommend.models.EASE import EASE


class TestEASERecommend:
    def test_recommend_excludes_context_and_returns_top_k(self):
        model = EASE(reg=100)
        # 4 items; item 0 is strongly related to 1 and 2, weakly to 3
        model.enc_w = np.array([
            [0.0, 0.9, 0.5, 0.1],
            [0.9, 0.0, 0.4, 0.2],
            [0.5, 0.4, 0.0, 0.3],
            [0.1, 0.2, 0.3, 0.0],
        ], dtype=np.float64)
        model.num_items = 4

        # Context contains item 0 — predict() masks seen items to -inf
        recs = model.recommend([0], top_k=2)
        assert len(recs) == 2
        assert 0 not in recs
        # Highest remaining affinity from row/col 0 is item 1 then 2
        assert recs[0] == 1
        assert recs[1] == 2

    def test_recommend_requires_fitted_weights(self):
        model = EASE(reg=100)
        model.num_items = 3
        model.enc_w = None
        try:
            model.recommend([0], top_k=1)
            assert False, 'expected TypeError/ValueError when enc_w is None'
        except (TypeError, ValueError, AttributeError):
            pass
