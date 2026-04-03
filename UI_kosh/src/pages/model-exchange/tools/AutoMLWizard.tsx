import { useState, useCallback } from 'react';
import './AutoMLWizard.css';
import type { WizardStep, DatasetMetadata, ColumnInfo, MLTask, ModelType, TrainingStartRequest } from './types';
import WizardStepper from './components/WizardStepper';
import StepSelectDataset from './components/StepSelectDataset';
import StepConfigureData from './components/StepConfigureData';
import StepConfiguration from './components/StepConfiguration';
import StepTraining from './components/StepTraining';
import StepResults from './components/StepResults';
import * as api from './api';

interface Props {
  onBack: () => void;
}

const AutoMLWizard = ({ onBack }: Props) => {
  const [step, setStep] = useState<WizardStep>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [dataset, setDataset] = useState<DatasetMetadata | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [featureColumns, setFeatureColumns] = useState<string[]>([]);
  const [mlTask, setMlTask] = useState<MLTask>('classification');
  const [selectedModels, setSelectedModels] = useState<ModelType[]>(['DRF', 'GBM', 'XGBoost']);
  const [autoMode, setAutoMode] = useState(false);
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [nfolds, setNfolds] = useState(5);
  const [maxModels, setMaxModels] = useState(20);
  const [maxRuntimeSecs, setMaxRuntimeSecs] = useState(300);
  const [runId, setRunId] = useState<string | null>(null);

  const goToStep = (s: WizardStep) => setStep(s);

  const handleDatasetSelect = async (ds: DatasetMetadata) => {
    setDataset(ds);
    try {
      const colData = await api.getDatasetColumns(ds.id);
      setColumns(colData.columns);
      const features = colData.columns.map((c) => c.name);
      setFeatureColumns(features);
    } catch { /* ignore */ }
    setCompletedSteps((prev) => [...new Set([...prev, 0])]);
    setStep(1);
  };

  const handleConfigContinue = () => {
    setCompletedSteps((prev) => [...new Set([...prev, 1])]);
    setStep(2);
  };

  const handleStartTraining = async () => {
    setCompletedSteps((prev) => [...new Set([...prev, 2])]);
    setStep(3);

    try {
      const req: TrainingStartRequest = {
        dataset_id: dataset!.id,
        target_column: targetColumn,
        feature_columns: featureColumns,
        ml_task: mlTask,
        models: autoMode ? [] : selectedModels,
        auto_mode: autoMode,
        train_test_split: trainTestSplit,
        nfolds,
        max_models: maxModels,
        max_runtime_secs: maxRuntimeSecs,
      };
      const res = await api.startTraining(req);
      setRunId(res.run_id);
    } catch (e) {
      alert('Failed to start training. Check backend connection.');
      setStep(2);
    }
  };

  const handleTrainingComplete = useCallback(() => {
    setCompletedSteps((prev) => [...new Set([...prev, 3])]);
    setStep(4);
  }, []);

  const handleReset = () => {
    setStep(0);
    setCompletedSteps([]);
    setDataset(null);
    setColumns([]);
    setTargetColumn('');
    setFeatureColumns([]);
    setRunId(null);
    setAutoMode(false);
    setSelectedModels(['DRF', 'GBM', 'XGBoost']);
  };

  return (
    <div className="aw-page">
      <div className="aw-header">
        <div className="aw-header-left">
          <span className="aw-logo">AI Kosh</span>
          <span className="aw-logo-sub">NTT DATA</span>
        </div>
        <div className="aw-header-right">
          <button className="aw-header-btn" onClick={handleReset}>↻ Reset</button>
          <button className="aw-header-btn" onClick={onBack}>← Back to Hub</button>
        </div>
      </div>

      <div className="aw-container">
        <div className="aw-title-section">
          <h1 className="aw-title">AutoML Wizard</h1>
          <p className="aw-subtitle">Train and optimize machine learning models automatically with our guided wizard</p>
        </div>

        <WizardStepper currentStep={step} onStepClick={goToStep} completedSteps={completedSteps} />

        <div className="aw-content">
          {step === 0 && (
            <StepSelectDataset dataset={dataset} onSelect={handleDatasetSelect} />
          )}
          {step === 1 && dataset && (
            <StepConfigureData
              datasetId={dataset.id}
              columns={columns}
              targetColumn={targetColumn}
              featureColumns={featureColumns}
              onTargetChange={setTargetColumn}
              onFeaturesChange={setFeatureColumns}
              onContinue={handleConfigContinue}
            />
          )}
          {step === 2 && (
            <StepConfiguration
              mlTask={mlTask}
              selectedModels={selectedModels}
              autoMode={autoMode}
              trainTestSplit={trainTestSplit}
              nfolds={nfolds}
              maxModels={maxModels}
              maxRuntimeSecs={maxRuntimeSecs}
              onTaskChange={setMlTask}
              onModelsChange={setSelectedModels}
              onAutoModeChange={setAutoMode}
              onSplitChange={setTrainTestSplit}
              onNfoldsChange={setNfolds}
              onMaxModelsChange={setMaxModels}
              onMaxRuntimeChange={setMaxRuntimeSecs}
              onStartTraining={handleStartTraining}
            />
          )}
          {step === 3 && runId && (
            <StepTraining runId={runId} onComplete={handleTrainingComplete} reviewMode={completedSteps.includes(3)} />
          )}
          {step === 4 && runId && (
            <StepResults runId={runId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoMLWizard;
