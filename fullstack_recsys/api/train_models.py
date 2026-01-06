#!/usr/bin/env python3
"""
Standalone script to train recommendation models from ML-100k data
This script doesn't require Flask/SQLAlchemy setup
"""
import os
import sys
import argparse
import numpy as np
import scipy.sparse as sp
from tqdm import tqdm

# Add recommend directory to path
sys.path.insert(0, os.path.dirname(__file__))
from recommend.models import model_to_cls
from recommend.evaluate import extract_top_k, evaluate

def load_ml100k_data(data_file):
    """Load rating data from ML-100k u.data file"""
    users = []
    items = []
    ratings = []
    
    print(f"Loading data from {data_file}...")
    with open(data_file, 'r') as f:
        for line in tqdm(f, desc="Reading ratings"):
            parts = line.strip().split()
            if len(parts) >= 3:
                user_id = int(parts[0]) - 1  # Convert to 0-indexed
                item_id = int(parts[1]) - 1  # Convert to 0-indexed
                rating = int(parts[2])
                
                # Use implicit feedback (1 if rating >= 4, else 0)
                # Or use all ratings as implicit (any interaction = 1)
                users.append(user_id)
                items.append(item_id)
                ratings.append(1)  # implicit feedback
    
    # Find max user and item IDs to determine matrix size
    max_user = max(users) if users else 0
    max_item = max(items) if items else 0
    
    # Create sparse matrix (users x items)
    # Note: ML-100k has 943 users and 1682 items
    num_users = max_user + 1
    num_items = max_item + 1
    
    print(f"Creating rating matrix: {num_users} users x {num_items} items")
    rating_matrix = sp.csr_matrix((ratings, (users, items)), shape=(num_users, num_items))
    
    return rating_matrix

def split_train_test(rating_matrix, test_ratio=0.1):
    """Split rating matrix into train and test sets"""
    num_users, num_items = rating_matrix.shape
    train_data = {'users': [], 'items': [], 'ratings': []}
    test_data = {'users': [], 'items': [], 'ratings': []}
    
    print(f"Splitting data (test_ratio={test_ratio})...")
    for u in tqdm(range(num_users), desc="Splitting"):
        u_items = rating_matrix.indices[rating_matrix.indptr[u]: rating_matrix.indptr[u+1]]
        if len(u_items) == 0:
            continue
            
        num_test = max(1, int(len(u_items) * test_ratio))
        test_idx = np.random.choice(list(range(len(u_items))), size=num_test, replace=False)
        
        for i, item_id in enumerate(u_items):
            if i in test_idx:
                test_data['users'].append(u)
                test_data['items'].append(item_id)
                test_data['ratings'].append(1.0)
            else:
                train_data['users'].append(u)
                train_data['items'].append(item_id)
                train_data['ratings'].append(1.0)
    
    train_matrix = sp.csr_matrix(
        (train_data['ratings'], (train_data['users'], train_data['items'])), 
        shape=(num_users, num_items)
    )
    test_matrix = sp.csr_matrix(
        (test_data['ratings'], (test_data['users'], test_data['items'])), 
        shape=(num_users, num_items)
    )
    
    return train_matrix, test_matrix

def main():
    parser = argparse.ArgumentParser(description='Train recommendation models from ML-100k data')
    parser.add_argument('--model', type=str, default='EASE', choices=['EASE', 'ItemKNN'],
                        help='Model to train')
    parser.add_argument('--data_file', type=str, 
                        default='../backend/data/ml-100k/u.data',
                        help='Path to ML-100k u.data file')
    parser.add_argument('--save_dir', type=str, default='recommend/ckpt',
                        help='Directory to save model checkpoints')
    parser.add_argument('--test_ratio', type=float, default=0.1,
                        help='Ratio of test data')
    parser.add_argument('--k', type=int, default=100,
                        help='Top-k for evaluation')
    args = parser.parse_args()
    
    # Create save directory
    os.makedirs(args.save_dir, exist_ok=True)
    
    # Load data
    if not os.path.exists(args.data_file):
        print(f"Error: Data file not found: {args.data_file}")
        print("Please ensure the ML-100k data is available.")
        sys.exit(1)
    
    rating_matrix = load_ml100k_data(args.data_file)
    num_users, num_items = rating_matrix.shape
    print(f"Loaded rating matrix: {num_users} users, {num_items} items")
    print(f"Total interactions: {rating_matrix.nnz}")
    
    # Split train/test
    train_matrix, test_matrix = split_train_test(rating_matrix, test_ratio=args.test_ratio)
    print(f"Train interactions: {train_matrix.nnz}")
    print(f"Test interactions: {test_matrix.nnz}")
    
    # Get model class
    if args.model not in model_to_cls:
        print(f"Error: Model {args.model} not available")
        print(f"Available models: {list(model_to_cls.keys())}")
        sys.exit(1)
    
    model_cls = model_to_cls[args.model]
    model = model_cls()
    
    # Train model
    print(f'\n{"="*50}')
    print(f'Training {args.model} model...')
    print(f'{"="*50}')
    model.fit(train_matrix, save_path=args.save_dir)
    print(f'Training completed!')
    
    # Evaluate
    print(f'\n{"="*50}')
    print(f'Evaluating model...')
    print(f'{"="*50}')
    prediction = model.predict(train_matrix)
    topk = extract_top_k(prediction, args.k)
    scores = evaluate(topk, test_matrix, args.k)
    
    print(f'\nEvaluation Results:')
    print(f'  Precision@{args.k}: {scores["precision"]:.4f}')
    print(f'  Recall@{args.k}: {scores["recall"]:.4f}')
    print(f'  NDCG@{args.k}: {scores["ndcg"]:.4f}')
    
    # Save model (already saved in fit, but ensure it's there)
    model.save(args.save_dir)
    
    checkpoint_file = os.path.join(args.save_dir, model.save_filename + ('.npy' if args.model == 'EASE' else '.npz'))
    print(f'\n{"="*50}')
    print(f'Model saved to: {checkpoint_file}')
    print(f'{"="*50}')

if __name__ == '__main__':
    main()
