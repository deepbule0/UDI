import type { Dataset, Instance } from '../core/types';

// Fictional, bundled records. These are not connected to accounts or live services.
export const datasets: Dataset[] = [
  {
    id: 'aurora', name: 'Aurora lab', project: 'Neural scene reconstruction',
    description: 'A fictional computer-vision research project.',
    experiments: [
      { id: 'EXP-048', name: 'Adaptive attention', model: 'SceneNet', status: 'passed', psnr: 32.84, delta: 0.62, commitId: 'a31f9c2', date: '2026-10-16' },
      { id: 'EXP-047', name: 'Learning-rate ablation', model: 'SceneNet', status: 'failed', psnr: 30.41, delta: -1.81, commitId: '8ac13d2', date: '2026-10-16' },
      { id: 'EXP-046', name: 'Depth regularization', model: 'DepthFlow', status: 'passed', psnr: 31.96, delta: 0.48, commitId: 'b84e6f1', date: '2026-10-15' },
      { id: 'EXP-045', name: 'Sparse-view baseline', model: 'VoxelGS', status: 'running', psnr: 29.87, delta: 0, commitId: 'c71d4a8', date: '2026-10-15' },
      { id: 'EXP-044', name: 'Feature fusion v2', model: 'DepthFlow', status: 'failed', psnr: 30.23, delta: -0.73, commitId: 'd25b3e9', date: '2026-10-14' },
      { id: 'EXP-043', name: 'Multi-scale decoder', model: 'VoxelGS', status: 'passed', psnr: 31.52, delta: 0.36, commitId: 'e62c8b4', date: '2026-10-13' },
    ],
    commits: [
      { id: 'a31f9c2', title: 'Add adaptive attention blocks', files: ['models/attention.py'] },
      { id: '8ac13d2', title: 'Increase warmup learning rate', files: ['training/scheduler.py', 'config/train.yaml'] },
      { id: 'b84e6f1', title: 'Tune depth regularization weight', files: ['losses/depth.py'] },
      { id: 'c71d4a8', title: 'Initialize sparse-view experiment', files: ['config/sparse.yaml'] },
      { id: 'd25b3e9', title: 'Replace feature fusion operator', files: ['models/fusion.py'] },
      { id: 'e62c8b4', title: 'Add multi-scale decoder', files: ['models/decoder.py'] },
    ],
    deadlines: [
      { id: 'd1', title: 'Ablation study complete', date: '2026-10-21', category: 'Milestone' },
      { id: 'd2', title: 'Weekly lab review', date: '2026-10-23', category: 'Meeting' },
      { id: 'd3', title: 'First paper draft', date: '2026-10-30', category: 'Writing' },
    ],
    papers: [
      { id: 'p1', title: 'Adaptive representations for neural scenes', authors: 'Example et al.', year: 2026, tag: 'Scene representation' },
      { id: 'p2', title: 'Learning robust depth priors', authors: 'Sample et al.', year: 2025, tag: 'Depth estimation' },
      { id: 'p3', title: 'A study of sparse-view reconstruction', authors: 'Demo et al.', year: 2026, tag: 'Few-shot learning' },
    ],
  },
  {
    id: 'atlas', name: 'Atlas lab', project: 'Audio representation learning',
    description: 'A second fictional project, bound to the same interface package.',
    experiments: [
      { id: 'AUD-021', name: 'Spectral attention', model: 'AudioNet', status: 'passed', psnr: 28.72, delta: 0.91, commitId: 'f94a2b1', date: '2026-10-16' },
      { id: 'AUD-020', name: 'Noise augmentation', model: 'WaveFlow', status: 'passed', psnr: 27.36, delta: 0.42, commitId: 'e12c5d8', date: '2026-10-15' },
      { id: 'AUD-019', name: 'Channel mixing', model: 'AudioNet', status: 'failed', psnr: 25.14, delta: -1.27, commitId: 'd83b7e4', date: '2026-10-14' },
      { id: 'AUD-018', name: 'Reconstruction baseline', model: 'WaveFlow', status: 'passed', psnr: 26.94, delta: 0.18, commitId: 'c42f1a9', date: '2026-10-13' },
    ],
    commits: [
      { id: 'f94a2b1', title: 'Introduce spectral attention', files: ['audio/attention.py'] },
      { id: 'e12c5d8', title: 'Adjust noise augmentation', files: ['audio/augment.py'] },
      { id: 'd83b7e4', title: 'Change channel mixer', files: ['audio/mixer.py'] },
      { id: 'c42f1a9', title: 'Record reconstruction baseline', files: ['config/audio.yaml'] },
    ],
    deadlines: [
      { id: 'a1', title: 'Audio benchmark freeze', date: '2026-10-22', category: 'Milestone' },
      { id: 'a2', title: 'Listening study', date: '2026-10-27', category: 'Research' },
    ],
    papers: [
      { id: 'ap1', title: 'Structured audio representations', authors: 'Fictional et al.', year: 2026, tag: 'Audio learning' },
      { id: 'ap2', title: 'Robust spectral reconstruction', authors: 'Illustrative et al.', year: 2025, tag: 'Reconstruction' },
    ],
  },
];

export const createInstances = (): Record<string, Instance> => Object.fromEntries(datasets.map(d => [d.id, {
  id: `local-${d.id}`, datasetId: d.id,
  grants: ['experiments.read', 'commits.read', 'deadlines.read', 'papers.read'], notes: [],
}]));
