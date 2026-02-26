"""
Hyperparameter Tuning Engine - Provides grid search, random search, 
Bayesian optimization, and evolutionary strategies for model hyperparameter tuning.
"""

import logging
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from itertools import product
from collections import defaultdict

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ParameterSpace:
    """Defines a hyperparameter search space."""
    name: str
    param_type: str  # "continuous", "integer", "categorical", "log_uniform"
    low: Optional[float] = None
    high: Optional[float] = None
    choices: Optional[List[Any]] = None
    log_scale: bool = False
    default: Optional[Any] = None

    def sample(self, rng: np.random.RandomState) -> Any:
        """Sample a random value from this space."""
        if self.param_type == "continuous":
            if self.log_scale:
                return float(np.exp(rng.uniform(np.log(self.low), np.log(self.high))))
            return float(rng.uniform(self.low, self.high))
        elif self.param_type == "integer":
            return int(rng.randint(self.low, self.high + 1))
        elif self.param_type == "categorical":
            return self.choices[rng.randint(len(self.choices))]
        elif self.param_type == "log_uniform":
            return float(np.exp(rng.uniform(np.log(self.low), np.log(self.high))))
        return self.default

    def grid_values(self, n_points: int = 5) -> List[Any]:
        """Generate grid values for this parameter."""
        if self.param_type == "categorical":
            return self.choices or []
        elif self.param_type == "integer":
            vals = np.linspace(self.low, self.high, min(n_points, int(self.high - self.low + 1)))
            return [int(v) for v in np.unique(np.round(vals))]
        elif self.param_type in ("continuous", "log_uniform"):
            if self.log_scale or self.param_type == "log_uniform":
                return list(np.exp(np.linspace(np.log(self.low), np.log(self.high), n_points)))
            return list(np.linspace(self.low, self.high, n_points))
        return [self.default]


@dataclass
class TuningResult:
    """Result from hyperparameter tuning."""
    trial_id: str = ""
    params: Dict[str, Any] = field(default_factory=dict)
    metric_value: float = 0.0
    cv_mean: float = 0.0
    cv_std: float = 0.0
    training_time: float = 0.0
    trial_number: int = 0

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class TuningReport:
    """Comprehensive tuning report."""
    tuning_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    strategy: str = ""
    n_trials: int = 0
    best_params: Dict[str, Any] = field(default_factory=dict)
    best_metric: float = 0.0
    all_trials: List[Dict] = field(default_factory=list)
    total_time_seconds: float = 0.0
    convergence_history: List[float] = field(default_factory=list)
    parameter_importance: Dict[str, float] = field(default_factory=dict)
    early_stopped: bool = False

    def to_dict(self) -> Dict:
        return asdict(self)


COMMON_SEARCH_SPACES = {
    "random_forest": [
        ParameterSpace("n_estimators", "integer", low=50, high=500),
        ParameterSpace("max_depth", "integer", low=3, high=30),
        ParameterSpace("min_samples_split", "integer", low=2, high=20),
        ParameterSpace("min_samples_leaf", "integer", low=1, high=10),
        ParameterSpace("max_features", "categorical", choices=["sqrt", "log2", 0.5, 0.75]),
        ParameterSpace("class_weight", "categorical", choices=[None, "balanced"]),
    ],
    "gradient_boosting": [
        ParameterSpace("n_estimators", "integer", low=50, high=500),
        ParameterSpace("max_depth", "integer", low=3, high=15),
        ParameterSpace("learning_rate", "log_uniform", low=0.001, high=0.3),
        ParameterSpace("subsample", "continuous", low=0.5, high=1.0),
        ParameterSpace("min_samples_split", "integer", low=2, high=20),
        ParameterSpace("min_samples_leaf", "integer", low=1, high=10),
    ],
    "xgboost": [
        ParameterSpace("n_estimators", "integer", low=50, high=500),
        ParameterSpace("max_depth", "integer", low=3, high=15),
        ParameterSpace("learning_rate", "log_uniform", low=0.001, high=0.3),
        ParameterSpace("subsample", "continuous", low=0.5, high=1.0),
        ParameterSpace("colsample_bytree", "continuous", low=0.3, high=1.0),
        ParameterSpace("reg_alpha", "log_uniform", low=0.001, high=10.0),
        ParameterSpace("reg_lambda", "log_uniform", low=0.001, high=10.0),
        ParameterSpace("gamma", "log_uniform", low=0.001, high=5.0),
    ],
    "svm": [
        ParameterSpace("C", "log_uniform", low=0.01, high=100.0),
        ParameterSpace("kernel", "categorical", choices=["rbf", "linear", "poly"]),
        ParameterSpace("gamma", "categorical", choices=["scale", "auto"]),
    ],
    "logistic_regression": [
        ParameterSpace("C", "log_uniform", low=0.01, high=100.0),
        ParameterSpace("penalty", "categorical", choices=["l1", "l2", "elasticnet"]),
        ParameterSpace("solver", "categorical", choices=["lbfgs", "saga"]),
        ParameterSpace("max_iter", "integer", low=100, high=1000),
    ],
    "neural_network": [
        ParameterSpace("learning_rate", "log_uniform", low=0.0001, high=0.01),
        ParameterSpace("batch_size", "categorical", choices=[16, 32, 64, 128]),
        ParameterSpace("hidden_layers", "integer", low=1, high=5),
        ParameterSpace("hidden_units", "categorical", choices=[32, 64, 128, 256, 512]),
        ParameterSpace("dropout_rate", "continuous", low=0.0, high=0.5),
        ParameterSpace("activation", "categorical", choices=["relu", "elu", "selu"]),
        ParameterSpace("optimizer", "categorical", choices=["adam", "sgd", "rmsprop"]),
    ],
}


class GridSearchTuner:
    """Exhaustive grid search over parameter space."""

    def __init__(self, objective_fn: Callable, parameter_spaces: List[ParameterSpace], n_grid_points: int = 5):
        self.objective_fn = objective_fn
        self.parameter_spaces = parameter_spaces
        self.n_grid_points = n_grid_points

    def search(self, maximize: bool = True) -> TuningReport:
        """Run exhaustive grid search."""
        start_time = time.time()
        param_names = [p.name for p in self.parameter_spaces]
        param_values = [p.grid_values(self.n_grid_points) for p in self.parameter_spaces]

        all_combos = list(product(*param_values))
        logger.info(f"Grid search: {len(all_combos)} parameter combinations")

        trials = []
        best_metric = -float("inf") if maximize else float("inf")
        best_params = {}
        convergence = []

        for i, combo in enumerate(all_combos):
            params = dict(zip(param_names, combo))
            trial_start = time.time()

            try:
                metric_value = self.objective_fn(params)
            except Exception as e:
                logger.warning(f"Trial {i+1} failed: {e}")
                continue

            trial_time = time.time() - trial_start

            result = TuningResult(
                trial_id=str(uuid.uuid4()),
                params=params,
                metric_value=metric_value,
                training_time=trial_time,
                trial_number=i + 1,
            )
            trials.append(result.to_dict())

            improved = (metric_value > best_metric) if maximize else (metric_value < best_metric)
            if improved:
                best_metric = metric_value
                best_params = params.copy()

            convergence.append(best_metric)

        total_time = time.time() - start_time
        param_importance = self._calculate_param_importance(trials, maximize)

        return TuningReport(
            strategy="grid_search",
            n_trials=len(trials),
            best_params=best_params,
            best_metric=best_metric,
            all_trials=trials,
            total_time_seconds=round(total_time, 2),
            convergence_history=convergence,
            parameter_importance=param_importance,
        )

    def _calculate_param_importance(self, trials: List[Dict], maximize: bool) -> Dict[str, float]:
        """Estimate parameter importance by variance analysis."""
        if len(trials) < 2:
            return {}

        param_names = list(trials[0]["params"].keys())
        importances = {}

        for param in param_names:
            unique_values = set()
            value_metrics = defaultdict(list)
            for t in trials:
                val = str(t["params"][param])
                unique_values.add(val)
                value_metrics[val].append(t["metric_value"])

            if len(unique_values) > 1:
                group_means = [np.mean(v) for v in value_metrics.values()]
                importances[param] = round(float(np.std(group_means)), 4)
            else:
                importances[param] = 0.0

        # Normalize
        total = sum(importances.values())
        if total > 0:
            importances = {k: round(v / total, 4) for k, v in importances.items()}

        return importances


class RandomSearchTuner:
    """Random search with optional early stopping."""

    def __init__(
        self,
        objective_fn: Callable,
        parameter_spaces: List[ParameterSpace],
        n_trials: int = 100,
        seed: int = 42,
    ):
        self.objective_fn = objective_fn
        self.parameter_spaces = parameter_spaces
        self.n_trials = n_trials
        self.rng = np.random.RandomState(seed)

    def search(
        self,
        maximize: bool = True,
        patience: int = 20,
    ) -> TuningReport:
        """Run random search with early stopping."""
        start_time = time.time()
        trials = []
        best_metric = -float("inf") if maximize else float("inf")
        best_params = {}
        convergence = []
        no_improvement_count = 0
        early_stopped = False

        for i in range(self.n_trials):
            params = {p.name: p.sample(self.rng) for p in self.parameter_spaces}
            trial_start = time.time()

            try:
                metric_value = self.objective_fn(params)
            except Exception as e:
                logger.warning(f"Trial {i+1} failed: {e}")
                continue

            trial_time = time.time() - trial_start

            result = TuningResult(
                trial_id=str(uuid.uuid4()),
                params=params,
                metric_value=metric_value,
                training_time=trial_time,
                trial_number=i + 1,
            )
            trials.append(result.to_dict())

            improved = (metric_value > best_metric) if maximize else (metric_value < best_metric)
            if improved:
                best_metric = metric_value
                best_params = params.copy()
                no_improvement_count = 0
            else:
                no_improvement_count += 1

            convergence.append(best_metric)

            if patience and no_improvement_count >= patience:
                logger.info(f"Early stopping at trial {i+1}")
                early_stopped = True
                break

        total_time = time.time() - start_time

        return TuningReport(
            strategy="random_search",
            n_trials=len(trials),
            best_params=best_params,
            best_metric=best_metric,
            all_trials=trials,
            total_time_seconds=round(total_time, 2),
            convergence_history=convergence,
            early_stopped=early_stopped,
        )


class BayesianOptimizer:
    """
    Bayesian optimization using Gaussian Process surrogate model.
    Simplified implementation using Expected Improvement acquisition.
    """

    def __init__(
        self,
        objective_fn: Callable,
        parameter_spaces: List[ParameterSpace],
        n_trials: int = 50,
        n_initial: int = 10,
        seed: int = 42,
    ):
        self.objective_fn = objective_fn
        self.parameter_spaces = parameter_spaces
        self.n_trials = n_trials
        self.n_initial = n_initial
        self.rng = np.random.RandomState(seed)
        self.X_observed: List[np.ndarray] = []
        self.y_observed: List[float] = []

    def search(self, maximize: bool = True) -> TuningReport:
        """Run Bayesian optimization."""
        start_time = time.time()
        trials = []
        best_metric = -float("inf") if maximize else float("inf")
        best_params = {}
        convergence = []

        # Phase 1: Random initialization
        for i in range(self.n_initial):
            params = {p.name: p.sample(self.rng) for p in self.parameter_spaces}
            x_encoded = self._encode_params(params)

            try:
                metric_value = self.objective_fn(params)
            except Exception as e:
                logger.warning(f"Initial trial {i+1} failed: {e}")
                continue

            self.X_observed.append(x_encoded)
            self.y_observed.append(metric_value if maximize else -metric_value)

            result = TuningResult(
                trial_id=str(uuid.uuid4()),
                params=params,
                metric_value=metric_value,
                trial_number=i + 1,
            )
            trials.append(result.to_dict())

            improved = (metric_value > best_metric) if maximize else (metric_value < best_metric)
            if improved:
                best_metric = metric_value
                best_params = params.copy()
            convergence.append(best_metric)

        # Phase 2: Bayesian optimization
        for i in range(self.n_initial, self.n_trials):
            params = self._suggest_next()
            x_encoded = self._encode_params(params)

            try:
                metric_value = self.objective_fn(params)
            except Exception as e:
                logger.warning(f"Trial {i+1} failed: {e}")
                continue

            self.X_observed.append(x_encoded)
            self.y_observed.append(metric_value if maximize else -metric_value)

            result = TuningResult(
                trial_id=str(uuid.uuid4()),
                params=params,
                metric_value=metric_value,
                trial_number=i + 1,
            )
            trials.append(result.to_dict())

            improved = (metric_value > best_metric) if maximize else (metric_value < best_metric)
            if improved:
                best_metric = metric_value
                best_params = params.copy()
            convergence.append(best_metric)

        total_time = time.time() - start_time

        return TuningReport(
            strategy="bayesian_optimization",
            n_trials=len(trials),
            best_params=best_params,
            best_metric=best_metric,
            all_trials=trials,
            total_time_seconds=round(total_time, 2),
            convergence_history=convergence,
        )

    def _encode_params(self, params: Dict[str, Any]) -> np.ndarray:
        """Encode parameters to numerical array."""
        encoded = []
        for space in self.parameter_spaces:
            val = params[space.name]
            if space.param_type == "categorical":
                idx = space.choices.index(val) if val in space.choices else 0
                encoded.append(idx / max(len(space.choices) - 1, 1))
            elif space.param_type in ("continuous", "log_uniform"):
                if space.log_scale or space.param_type == "log_uniform":
                    encoded.append((np.log(val) - np.log(space.low)) / (np.log(space.high) - np.log(space.low)))
                else:
                    encoded.append((val - space.low) / (space.high - space.low))
            elif space.param_type == "integer":
                encoded.append((val - space.low) / (space.high - space.low))
        return np.array(encoded)

    def _suggest_next(self) -> Dict[str, Any]:
        """Suggest next parameters using acquisition function."""
        if not self.X_observed:
            return {p.name: p.sample(self.rng) for p in self.parameter_spaces}

        X = np.array(self.X_observed)
        y = np.array(self.y_observed)

        # Generate candidates
        n_candidates = 1000
        candidates = []
        for _ in range(n_candidates):
            params = {p.name: p.sample(self.rng) for p in self.parameter_spaces}
            candidates.append(params)

        # Expected Improvement via surrogate (simplified kernel density estimation)
        best_y = np.max(y)
        best_candidate = None
        best_ei = -float("inf")

        for params in candidates:
            x = self._encode_params(params)
            # Simple distance-based surrogate
            distances = np.array([np.linalg.norm(x - xi) for xi in X])
            weights = np.exp(-distances * 5)
            weights /= np.sum(weights) + 1e-10

            mu = np.sum(weights * y)
            sigma = np.sqrt(np.sum(weights * (y - mu) ** 2) + 0.01)

            # Expected Improvement
            z = (mu - best_y) / sigma
            ei = sigma * (z * self._norm_cdf(z) + self._norm_pdf(z))

            if ei > best_ei:
                best_ei = ei
                best_candidate = params

        return best_candidate or candidates[0]

    @staticmethod
    def _norm_cdf(x: float) -> float:
        """Approximate standard normal CDF."""
        return 0.5 * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (x + 0.044715 * x ** 3)))

    @staticmethod
    def _norm_pdf(x: float) -> float:
        """Standard normal PDF."""
        return np.exp(-0.5 * x ** 2) / np.sqrt(2 * np.pi)


class EvolutionaryOptimizer:
    """
    Evolutionary strategy for hyperparameter optimization.
    Uses tournament selection, crossover, and mutation.
    """

    def __init__(
        self,
        objective_fn: Callable,
        parameter_spaces: List[ParameterSpace],
        population_size: int = 20,
        n_generations: int = 30,
        mutation_rate: float = 0.3,
        crossover_rate: float = 0.7,
        seed: int = 42,
    ):
        self.objective_fn = objective_fn
        self.parameter_spaces = parameter_spaces
        self.population_size = population_size
        self.n_generations = n_generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.rng = np.random.RandomState(seed)

    def search(self, maximize: bool = True) -> TuningReport:
        """Run evolutionary optimization."""
        start_time = time.time()
        trials = []
        convergence = []
        trial_counter = 0

        # Initialize population
        population = []
        for _ in range(self.population_size):
            params = {p.name: p.sample(self.rng) for p in self.parameter_spaces}
            try:
                fitness = self.objective_fn(params)
            except Exception:
                fitness = -float("inf") if maximize else float("inf")

            trial_counter += 1
            population.append({"params": params, "fitness": fitness})
            trials.append(TuningResult(
                trial_id=str(uuid.uuid4()),
                params=params,
                metric_value=fitness,
                trial_number=trial_counter,
            ).to_dict())

        best_metric = max(p["fitness"] for p in population) if maximize else min(p["fitness"] for p in population)
        best_individual = max(population, key=lambda x: x["fitness"] if maximize else -x["fitness"])
        best_params = best_individual["params"].copy()
        convergence.append(best_metric)

        # Evolution loop
        for gen in range(self.n_generations):
            new_population = []

            # Elitism: keep top 2
            sorted_pop = sorted(population, key=lambda x: x["fitness"], reverse=maximize)
            new_population.extend(sorted_pop[:2])

            while len(new_population) < self.population_size:
                # Tournament selection
                parent1 = self._tournament_select(population, maximize)
                parent2 = self._tournament_select(population, maximize)

                # Crossover
                if self.rng.random() < self.crossover_rate:
                    child_params = self._crossover(parent1["params"], parent2["params"])
                else:
                    child_params = parent1["params"].copy()

                # Mutation
                child_params = self._mutate(child_params)

                try:
                    fitness = self.objective_fn(child_params)
                except Exception:
                    fitness = -float("inf") if maximize else float("inf")

                trial_counter += 1
                new_population.append({"params": child_params, "fitness": fitness})
                trials.append(TuningResult(
                    trial_id=str(uuid.uuid4()),
                    params=child_params,
                    metric_value=fitness,
                    trial_number=trial_counter,
                ).to_dict())

            population = new_population

            gen_best = max(p["fitness"] for p in population) if maximize else min(p["fitness"] for p in population)
            improved = (gen_best > best_metric) if maximize else (gen_best < best_metric)
            if improved:
                best_metric = gen_best
                best_individual = max(population, key=lambda x: x["fitness"] if maximize else -x["fitness"])
                best_params = best_individual["params"].copy()

            convergence.append(best_metric)
            logger.info(f"Generation {gen+1}: best={best_metric:.4f}")

        total_time = time.time() - start_time

        return TuningReport(
            strategy="evolutionary",
            n_trials=len(trials),
            best_params=best_params,
            best_metric=best_metric,
            all_trials=trials,
            total_time_seconds=round(total_time, 2),
            convergence_history=convergence,
        )

    def _tournament_select(self, population: List[Dict], maximize: bool, k: int = 3) -> Dict:
        """Tournament selection."""
        candidates = [population[self.rng.randint(len(population))] for _ in range(k)]
        return max(candidates, key=lambda x: x["fitness"] if maximize else -x["fitness"])

    def _crossover(self, p1: Dict[str, Any], p2: Dict[str, Any]) -> Dict[str, Any]:
        """Uniform crossover."""
        child = {}
        for space in self.parameter_spaces:
            child[space.name] = p1[space.name] if self.rng.random() < 0.5 else p2[space.name]
        return child

    def _mutate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Mutate parameters."""
        mutated = params.copy()
        for space in self.parameter_spaces:
            if self.rng.random() < self.mutation_rate:
                if space.param_type == "categorical":
                    mutated[space.name] = space.choices[self.rng.randint(len(space.choices))]
                elif space.param_type in ("continuous", "log_uniform"):
                    current = mutated[space.name]
                    noise = self.rng.normal(0, 0.1) * (space.high - space.low)
                    mutated[space.name] = float(np.clip(current + noise, space.low, space.high))
                elif space.param_type == "integer":
                    current = mutated[space.name]
                    delta = self.rng.randint(-2, 3)
                    mutated[space.name] = int(np.clip(current + delta, space.low, space.high))
        return mutated


class HyperparameterTuner:
    """Main hyperparameter tuning engine supporting multiple strategies."""

    def __init__(self):
        self.tuning_history: List[TuningReport] = []

    def tune(
        self,
        objective_fn: Callable,
        parameter_spaces: Optional[List[ParameterSpace]] = None,
        algorithm: str = "random_forest",
        strategy: str = "random",
        n_trials: int = 100,
        maximize: bool = True,
        seed: int = 42,
    ) -> TuningReport:
        """Run hyperparameter tuning."""
        if parameter_spaces is None:
            parameter_spaces = COMMON_SEARCH_SPACES.get(algorithm, [])

        if not parameter_spaces:
            logger.warning(f"No search space defined for algorithm: {algorithm}")
            return TuningReport(strategy=strategy, n_trials=0)

        logger.info(f"Starting {strategy} tuning: {len(parameter_spaces)} parameters, {n_trials} trials")

        if strategy == "grid":
            tuner = GridSearchTuner(objective_fn, parameter_spaces)
            report = tuner.search(maximize=maximize)
        elif strategy == "random":
            tuner = RandomSearchTuner(objective_fn, parameter_spaces, n_trials=n_trials, seed=seed)
            report = tuner.search(maximize=maximize)
        elif strategy == "bayesian":
            tuner = BayesianOptimizer(
                objective_fn, parameter_spaces, n_trials=n_trials,
                n_initial=min(10, n_trials // 3), seed=seed,
            )
            report = tuner.search(maximize=maximize)
        elif strategy == "evolutionary":
            tuner = EvolutionaryOptimizer(
                objective_fn, parameter_spaces,
                population_size=min(20, n_trials // 3),
                n_generations=n_trials // 20 or 5,
                seed=seed,
            )
            report = tuner.search(maximize=maximize)
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

        self.tuning_history.append(report)
        logger.info(f"Tuning complete: best metric={report.best_metric:.4f}")
        return report

    def get_recommended_params(
        self,
        model_type: str,
        dataset_size: int,
        n_features: int,
        n_classes: int = 2,
    ) -> Dict[str, Any]:
        """Get recommended starting hyperparameters based on dataset characteristics."""
        recommendations = {
            "random_forest": {
                "n_estimators": min(300, max(100, dataset_size // 10)),
                "max_depth": min(20, max(5, int(np.log2(n_features * 3)))),
                "min_samples_split": max(2, dataset_size // 500),
                "min_samples_leaf": max(1, dataset_size // 1000),
                "max_features": "sqrt" if n_features > 20 else "log2",
                "class_weight": "balanced" if n_classes > 2 else None,
            },
            "gradient_boosting": {
                "n_estimators": 200,
                "max_depth": min(8, max(3, int(np.log2(n_features)))),
                "learning_rate": 0.1,
                "subsample": 0.8,
                "min_samples_split": max(2, dataset_size // 200),
            },
            "xgboost": {
                "n_estimators": 200,
                "max_depth": 6,
                "learning_rate": 0.1,
                "subsample": 0.8,
                "colsample_bytree": 0.8,
                "reg_alpha": 0.01,
                "reg_lambda": 1.0,
                "gamma": 0.1,
            },
            "neural_network": {
                "learning_rate": 0.001,
                "batch_size": min(64, max(16, dataset_size // 50)),
                "hidden_layers": 2 if n_features < 50 else 3,
                "hidden_units": min(256, max(32, n_features * 2)),
                "dropout_rate": 0.3,
                "activation": "relu",
                "optimizer": "adam",
            },
        }

        return recommendations.get(model_type, {})


# Singleton
hyperparameter_tuner = HyperparameterTuner()
