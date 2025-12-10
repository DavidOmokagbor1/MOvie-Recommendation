import os

from recommend.models.EASE import EASE
from recommend.models.ItemKNN import ItemKNN
from recommend.models.NeuralMF import NeuralMF
from recommend.models.DeepFM import DeepFM

BASE_DIR = 'recommend/ckpt'

model_to_ckpt = {
    'EASE': os.path.join(BASE_DIR, 'EASE_100.npy'),
    'ItemKNN': os.path.join(BASE_DIR, 'ItemKNN_100.npz'),
    'NeuralMF': os.path.join(BASE_DIR, 'NeuralMF_placeholder.pth'),  # Placeholder
    'DeepFM': os.path.join(BASE_DIR, 'DeepFM_placeholder.pth')  # Placeholder
}

model_to_cls = {
    'EASE': EASE,
    'ItemKNN': ItemKNN,
    'NeuralMF': NeuralMF,
    'DeepFM': DeepFM
}