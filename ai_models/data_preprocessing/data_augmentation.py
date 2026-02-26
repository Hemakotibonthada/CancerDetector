"""
Data Augmentation - Strategies for augmenting medical datasets including
tabular, image, and text data to improve model robustness and reduce overfitting.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class AugmentationResult:
    original_size: int = 0
    augmented_size: int = 0
    strategies_applied: List[str] = field(default_factory=list)
    augmentation_ratio: float = 0.0
    class_distribution: Dict = field(default_factory=dict)


# ============================================================================
# Tabular Data Augmentation
# ============================================================================

class SMOTEAugmenter:
    """
    Simplified SMOTE (Synthetic Minority Over-sampling Technique) for
    handling class imbalance in tabular medical data.
    """

    def __init__(self, k_neighbors: int = 5, seed: int = 42):
        self.k_neighbors = k_neighbors
        self.rng = np.random.RandomState(seed)

    def augment(
        self,
        X: np.ndarray,
        y: np.ndarray,
        target_ratio: float = 1.0,
        minority_class: Optional[int] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Apply SMOTE to balance classes."""
        classes, counts = np.unique(y, return_counts=True)

        if minority_class is None:
            minority_class = classes[np.argmin(counts)]

        majority_count = np.max(counts)
        target_count = int(majority_count * target_ratio)

        minority_mask = y == minority_class
        X_minority = X[minority_mask]
        n_minority = len(X_minority)

        if n_minority == 0:
            return X, y

        n_synthetic = target_count - n_minority
        if n_synthetic <= 0:
            return X, y

        synthetic_samples = []
        k = min(self.k_neighbors, n_minority - 1)

        for _ in range(n_synthetic):
            # Pick a random minority sample
            idx = self.rng.randint(n_minority)
            sample = X_minority[idx]

            # Find k nearest neighbors (simplified)
            distances = np.sqrt(np.sum((X_minority - sample) ** 2, axis=1))
            distances[idx] = float("inf")
            neighbor_indices = np.argsort(distances)[:k]

            # Pick a random neighbor
            nn_idx = neighbor_indices[self.rng.randint(k)]
            neighbor = X_minority[nn_idx]

            # Generate synthetic sample
            alpha = self.rng.random()
            synthetic = sample + alpha * (neighbor - sample)
            synthetic_samples.append(synthetic)

        synthetic_X = np.array(synthetic_samples)
        synthetic_y = np.full(len(synthetic_samples), minority_class)

        X_augmented = np.vstack([X, synthetic_X])
        y_augmented = np.concatenate([y, synthetic_y])

        logger.info(f"SMOTE: {n_minority} → {n_minority + n_synthetic} samples for class {minority_class}")
        return X_augmented, y_augmented


class TabularAugmenter:
    """Augment tabular data using various noise and mixing strategies."""

    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

    def gaussian_noise(
        self,
        X: np.ndarray,
        y: np.ndarray,
        noise_factor: float = 0.01,
        n_augmented: Optional[int] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Add Gaussian noise to create synthetic samples."""
        n_augmented = n_augmented or len(X)
        indices = self.rng.choice(len(X), n_augmented, replace=True)
        X_selected = X[indices].copy()

        # Scale noise by feature standard deviation
        stds = np.nanstd(X, axis=0)
        stds[stds == 0] = 1
        noise = self.rng.normal(0, noise_factor, X_selected.shape) * stds

        X_noisy = X_selected + noise
        y_noisy = y[indices]

        X_augmented = np.vstack([X, X_noisy])
        y_augmented = np.concatenate([y, y_noisy])

        return X_augmented, y_augmented

    def feature_dropout(
        self,
        X: np.ndarray,
        y: np.ndarray,
        dropout_rate: float = 0.1,
        n_augmented: Optional[int] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Randomly drop features (set to mean) to create augmented samples."""
        n_augmented = n_augmented or len(X)
        indices = self.rng.choice(len(X), n_augmented, replace=True)
        X_selected = X[indices].copy()

        # Replace dropped features with feature mean
        means = np.nanmean(X, axis=0)
        dropout_mask = self.rng.random(X_selected.shape) < dropout_rate
        X_selected[dropout_mask] = np.tile(means, (n_augmented, 1))[dropout_mask]

        X_augmented = np.vstack([X, X_selected])
        y_augmented = np.concatenate([y, y[indices]])

        return X_augmented, y_augmented

    def mixup(
        self,
        X: np.ndarray,
        y: np.ndarray,
        alpha: float = 0.2,
        n_augmented: Optional[int] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Mixup augmentation: linear interpolation between samples."""
        n_augmented = n_augmented or len(X)
        idx1 = self.rng.choice(len(X), n_augmented, replace=True)
        idx2 = self.rng.choice(len(X), n_augmented, replace=True)

        lambdas = self.rng.beta(alpha, alpha, n_augmented)

        X_mixed = np.zeros((n_augmented, X.shape[1]))
        y_mixed = np.zeros(n_augmented)

        for i in range(n_augmented):
            lam = lambdas[i]
            X_mixed[i] = lam * X[idx1[i]] + (1 - lam) * X[idx2[i]]
            # For classification, use the class of the dominant component
            y_mixed[i] = y[idx1[i]] if lam > 0.5 else y[idx2[i]]

        X_augmented = np.vstack([X, X_mixed])
        y_augmented = np.concatenate([y, y_mixed])

        return X_augmented, y_augmented

    def random_swap(
        self,
        X: np.ndarray,
        y: np.ndarray,
        swap_probability: float = 0.1,
        n_augmented: Optional[int] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Swap feature values between pairs of same-class samples."""
        n_augmented = n_augmented or len(X)
        classes = np.unique(y)
        synthetic_X = []
        synthetic_y = []

        for cls in classes:
            cls_mask = y == cls
            X_cls = X[cls_mask]
            n_cls = len(X_cls)
            n_gen = int(n_augmented * np.sum(cls_mask) / len(X))

            for _ in range(n_gen):
                idx1, idx2 = self.rng.choice(n_cls, 2, replace=False) if n_cls > 1 else (0, 0)
                new_sample = X_cls[idx1].copy()
                swap_mask = self.rng.random(X.shape[1]) < swap_probability
                new_sample[swap_mask] = X_cls[idx2][swap_mask]
                synthetic_X.append(new_sample)
                synthetic_y.append(cls)

        if synthetic_X:
            X_augmented = np.vstack([X, np.array(synthetic_X)])
            y_augmented = np.concatenate([y, np.array(synthetic_y)])
        else:
            X_augmented, y_augmented = X, y

        return X_augmented, y_augmented


# ============================================================================
# Image Data Augmentation
# ============================================================================

class ImageAugmenter:
    """
    Medical image augmentation strategies designed to preserve
    clinical features while increasing data diversity.
    """

    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

    def random_rotation(self, image: np.ndarray, max_angle: float = 15.0) -> np.ndarray:
        """Rotate image by small angle (suitable for medical images)."""
        angle = self.rng.uniform(-max_angle, max_angle)
        # Simple rotation via affine transform approximation
        h, w = image.shape[:2]
        cos_a = np.cos(np.radians(angle))
        sin_a = np.sin(np.radians(angle))

        rotated = np.zeros_like(image)
        cy, cx = h // 2, w // 2

        for y in range(h):
            for x in range(w):
                src_x = int(cos_a * (x - cx) + sin_a * (y - cy) + cx)
                src_y = int(-sin_a * (x - cx) + cos_a * (y - cy) + cy)
                if 0 <= src_x < w and 0 <= src_y < h:
                    rotated[y, x] = image[src_y, src_x]

        return rotated

    def random_flip(self, image: np.ndarray, horizontal: bool = True, vertical: bool = False) -> np.ndarray:
        """Random flip."""
        result = image.copy()
        if horizontal and self.rng.random() > 0.5:
            result = result[:, ::-1]
        if vertical and self.rng.random() > 0.5:
            result = result[::-1, :]
        return result

    def brightness_adjustment(self, image: np.ndarray, factor_range: Tuple = (0.8, 1.2)) -> np.ndarray:
        """Adjust brightness."""
        factor = self.rng.uniform(*factor_range)
        adjusted = image.astype(float) * factor
        return np.clip(adjusted, 0, 255).astype(image.dtype)

    def contrast_adjustment(self, image: np.ndarray, factor_range: Tuple = (0.8, 1.2)) -> np.ndarray:
        """Adjust contrast."""
        factor = self.rng.uniform(*factor_range)
        mean = np.mean(image)
        adjusted = (image.astype(float) - mean) * factor + mean
        return np.clip(adjusted, 0, 255).astype(image.dtype)

    def gaussian_noise(self, image: np.ndarray, std: float = 5.0) -> np.ndarray:
        """Add Gaussian noise."""
        noise = self.rng.normal(0, std, image.shape)
        noisy = image.astype(float) + noise
        return np.clip(noisy, 0, 255).astype(image.dtype)

    def random_crop_and_resize(self, image: np.ndarray, crop_fraction: float = 0.9) -> np.ndarray:
        """Random crop and resize back to original size."""
        h, w = image.shape[:2]
        crop_h = int(h * crop_fraction)
        crop_w = int(w * crop_fraction)

        start_y = self.rng.randint(0, h - crop_h + 1)
        start_x = self.rng.randint(0, w - crop_w + 1)

        cropped = image[start_y:start_y + crop_h, start_x:start_x + crop_w]

        # Simple resize via nearest neighbor
        if image.ndim == 3:
            resized = np.zeros_like(image)
            for i in range(h):
                for j in range(w):
                    src_i = int(i * crop_h / h)
                    src_j = int(j * crop_w / w)
                    resized[i, j] = cropped[min(src_i, crop_h - 1), min(src_j, crop_w - 1)]
        else:
            resized = np.zeros((h, w))
            for i in range(h):
                for j in range(w):
                    src_i = int(i * crop_h / h)
                    src_j = int(j * crop_w / w)
                    resized[i, j] = cropped[min(src_i, crop_h - 1), min(src_j, crop_w - 1)]

        return resized

    def elastic_deformation(self, image: np.ndarray, alpha: float = 10.0, sigma: float = 3.0) -> np.ndarray:
        """Elastic deformation (simplified for tissue images)."""
        h, w = image.shape[:2]
        # Generate random displacement fields
        dx = self.rng.uniform(-1, 1, (h, w)) * alpha
        dy = self.rng.uniform(-1, 1, (h, w)) * alpha

        # Simple Gaussian smoothing approximation
        for _ in range(int(sigma)):
            if h > 2 and w > 2:
                dx[1:-1, 1:-1] = (dx[:-2, 1:-1] + dx[2:, 1:-1] + dx[1:-1, :-2] + dx[1:-1, 2:]) / 4
                dy[1:-1, 1:-1] = (dy[:-2, 1:-1] + dy[2:, 1:-1] + dy[1:-1, :-2] + dy[1:-1, 2:]) / 4

        deformed = np.zeros_like(image)
        for i in range(h):
            for j in range(w):
                src_i = int(np.clip(i + dy[i, j], 0, h - 1))
                src_j = int(np.clip(j + dx[i, j], 0, w - 1))
                deformed[i, j] = image[src_i, src_j]

        return deformed

    def color_jitter(self, image: np.ndarray, hue_range: float = 0.05, saturation_range: float = 0.2) -> np.ndarray:
        """Color jitter (for RGB images)."""
        if image.ndim < 3 or image.shape[2] != 3:
            return image

        result = image.astype(float)

        # Simple channel-wise adjustment
        for c in range(3):
            factor = 1 + self.rng.uniform(-saturation_range, saturation_range)
            result[:, :, c] = result[:, :, c] * factor

        return np.clip(result, 0, 255).astype(image.dtype)

    def augment_batch(
        self,
        images: np.ndarray,
        labels: np.ndarray,
        strategies: Optional[List[str]] = None,
        augmentation_factor: int = 2,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Augment a batch of images."""
        if strategies is None:
            strategies = ["flip", "brightness", "contrast", "noise"]

        strategy_map = {
            "rotation": lambda img: self.random_rotation(img),
            "flip": lambda img: self.random_flip(img),
            "brightness": lambda img: self.brightness_adjustment(img),
            "contrast": lambda img: self.contrast_adjustment(img),
            "noise": lambda img: self.gaussian_noise(img),
            "crop": lambda img: self.random_crop_and_resize(img),
            "elastic": lambda img: self.elastic_deformation(img),
            "color_jitter": lambda img: self.color_jitter(img),
        }

        augmented_images = [images]
        augmented_labels = [labels]

        for _ in range(augmentation_factor - 1):
            batch_augmented = []
            for img in images:
                # Apply random subset of strategies
                n_strategies = self.rng.randint(1, min(4, len(strategies) + 1))
                selected = self.rng.choice(strategies, n_strategies, replace=False)

                aug_img = img.copy()
                for strategy in selected:
                    if strategy in strategy_map:
                        aug_img = strategy_map[strategy](aug_img)
                batch_augmented.append(aug_img)

            augmented_images.append(np.array(batch_augmented))
            augmented_labels.append(labels.copy())

        return np.vstack(augmented_images), np.concatenate(augmented_labels)


# ============================================================================
# Text Data Augmentation
# ============================================================================

class TextAugmenter:
    """Augment clinical text data."""

    MEDICAL_SYNONYMS = {
        "pain": ["discomfort", "ache", "soreness", "tenderness"],
        "fever": ["pyrexia", "elevated temperature", "febrile"],
        "cough": ["tussis"],
        "fatigue": ["exhaustion", "tiredness", "lethargy", "malaise"],
        "headache": ["cephalalgia", "head pain"],
        "nausea": ["queasiness", "upset stomach"],
        "vomiting": ["emesis"],
        "diarrhea": ["loose stools", "loose bowel movements"],
        "rash": ["skin eruption", "dermatitis", "exanthem"],
        "swelling": ["edema", "inflammation", "tumefaction"],
        "bleeding": ["hemorrhage", "blood loss"],
        "shortness of breath": ["dyspnea", "breathlessness"],
        "chest pain": ["thoracic pain", "chest discomfort"],
        "dizziness": ["vertigo", "lightheadedness"],
        "weight loss": ["cachexia", "decreased weight"],
        "anxiety": ["nervousness", "apprehension"],
        "depression": ["melancholia", "low mood"],
        "insomnia": ["sleeplessness", "difficulty sleeping"],
        "hypertension": ["high blood pressure", "elevated BP"],
        "diabetes": ["diabetes mellitus", "DM"],
    }

    def __init__(self, seed: int = 42):
        self.rng = np.random.RandomState(seed)

    def synonym_replacement(self, text: str, n_replacements: int = 2) -> str:
        """Replace medical terms with synonyms."""
        words = text.split()
        text_lower = text.lower()
        result = text

        replacements_made = 0
        for term, synonyms in self.MEDICAL_SYNONYMS.items():
            if term in text_lower and replacements_made < n_replacements:
                synonym = synonyms[self.rng.randint(len(synonyms))]
                result = result.replace(term, synonym, 1)
                replacements_made += 1

        return result

    def random_insertion(self, text: str, n_insertions: int = 1) -> str:
        """Insert random contextual words."""
        contextual_words = [
            "mild", "moderate", "severe", "acute", "chronic",
            "intermittent", "persistent", "recurrent", "bilateral",
            "progressive", "worsening", "improving", "stable",
        ]

        words = text.split()
        for _ in range(n_insertions):
            word = contextual_words[self.rng.randint(len(contextual_words))]
            pos = self.rng.randint(len(words) + 1)
            words.insert(pos, word)

        return " ".join(words)

    def random_deletion(self, text: str, deletion_prob: float = 0.1) -> str:
        """Randomly delete non-essential words."""
        stop_words = {"the", "a", "an", "is", "was", "were", "been", "being", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "that", "which", "who", "whom", "this", "these", "those"}

        words = text.split()
        if len(words) <= 3:
            return text

        result = [w for w in words if w.lower() not in stop_words or self.rng.random() > deletion_prob]
        return " ".join(result) if result else text

    def sentence_reordering(self, text: str) -> str:
        """Reorder sentences in clinical notes."""
        sentences = [s.strip() for s in text.split(".") if s.strip()]
        if len(sentences) <= 1:
            return text
        self.rng.shuffle(sentences)
        return ". ".join(sentences) + "."

    def augment_texts(
        self,
        texts: List[str],
        labels: np.ndarray,
        strategies: Optional[List[str]] = None,
        n_augmented_per_sample: int = 2,
    ) -> Tuple[List[str], np.ndarray]:
        """Augment a list of text samples."""
        if strategies is None:
            strategies = ["synonym", "insertion", "deletion"]

        strategy_map = {
            "synonym": self.synonym_replacement,
            "insertion": self.random_insertion,
            "deletion": self.random_deletion,
            "reorder": self.sentence_reordering,
        }

        augmented_texts = list(texts)
        augmented_labels = list(labels)

        for i, text in enumerate(texts):
            for _ in range(n_augmented_per_sample):
                strategy = strategies[self.rng.randint(len(strategies))]
                if strategy in strategy_map:
                    aug_text = strategy_map[strategy](text)
                    augmented_texts.append(aug_text)
                    augmented_labels.append(labels[i])

        return augmented_texts, np.array(augmented_labels)


# ============================================================================
# Unified Augmentation Pipeline
# ============================================================================

class DataAugmentationPipeline:
    """Unified data augmentation pipeline supporting tabular, image, and text data."""

    def __init__(self, seed: int = 42):
        self.smote = SMOTEAugmenter(seed=seed)
        self.tabular = TabularAugmenter(seed=seed)
        self.image = ImageAugmenter(seed=seed)
        self.text = TextAugmenter(seed=seed)
        self.seed = seed

    def augment_tabular(
        self,
        X: np.ndarray,
        y: np.ndarray,
        strategies: Optional[List[str]] = None,
        target_ratio: float = 1.0,
    ) -> Tuple[np.ndarray, np.ndarray, AugmentationResult]:
        """Augment tabular data."""
        if strategies is None:
            strategies = ["smote", "noise"]

        X_aug, y_aug = X.copy(), y.copy()

        for strategy in strategies:
            if strategy == "smote":
                X_aug, y_aug = self.smote.augment(X_aug, y_aug, target_ratio)
            elif strategy == "noise":
                X_aug, y_aug = self.tabular.gaussian_noise(X_aug, y_aug)
            elif strategy == "mixup":
                X_aug, y_aug = self.tabular.mixup(X_aug, y_aug)
            elif strategy == "dropout":
                X_aug, y_aug = self.tabular.feature_dropout(X_aug, y_aug)
            elif strategy == "swap":
                X_aug, y_aug = self.tabular.random_swap(X_aug, y_aug)

        classes, counts = np.unique(y_aug, return_counts=True)
        result = AugmentationResult(
            original_size=len(X),
            augmented_size=len(X_aug),
            strategies_applied=strategies,
            augmentation_ratio=len(X_aug) / len(X),
            class_distribution=dict(zip(classes.tolist(), counts.tolist())),
        )

        logger.info(f"Tabular augmentation: {result.original_size} → {result.augmented_size} samples")
        return X_aug, y_aug, result

    def augment_images(
        self,
        images: np.ndarray,
        labels: np.ndarray,
        strategies: Optional[List[str]] = None,
        augmentation_factor: int = 3,
    ) -> Tuple[np.ndarray, np.ndarray, AugmentationResult]:
        """Augment image data."""
        if strategies is None:
            strategies = ["flip", "brightness", "contrast", "noise"]

        X_aug, y_aug = self.image.augment_batch(images, labels, strategies, augmentation_factor)

        result = AugmentationResult(
            original_size=len(images),
            augmented_size=len(X_aug),
            strategies_applied=strategies,
            augmentation_ratio=len(X_aug) / len(images),
        )

        logger.info(f"Image augmentation: {result.original_size} → {result.augmented_size} samples")
        return X_aug, y_aug, result

    def augment_text(
        self,
        texts: List[str],
        labels: np.ndarray,
        strategies: Optional[List[str]] = None,
        n_per_sample: int = 2,
    ) -> Tuple[List[str], np.ndarray, AugmentationResult]:
        """Augment text data."""
        if strategies is None:
            strategies = ["synonym", "insertion"]

        texts_aug, y_aug = self.text.augment_texts(texts, labels, strategies, n_per_sample)

        result = AugmentationResult(
            original_size=len(texts),
            augmented_size=len(texts_aug),
            strategies_applied=strategies,
            augmentation_ratio=len(texts_aug) / len(texts),
        )

        logger.info(f"Text augmentation: {result.original_size} → {result.augmented_size} samples")
        return texts_aug, y_aug, result


# Singleton
augmentation_pipeline = DataAugmentationPipeline()
