import { useEffect, useState } from 'react';
import weightsUrl from '../data/doodle_weights.json?url';
import type { DoodleModel, DoodleNetState } from '../utils/doodleNet';
export const DOODLE_CATEGORIES = ['cat', 'dog', 'bird', 'fish', 'flower', 'tree', 'star', 'clock', 'car', 'book'];
let cached: Promise<DoodleModel> | null = null;
export function validateModel(raw: unknown): DoodleModel {
  const data = raw as {meta?: {categories?: string[]}; state?: DoodleNetState};
  if (!data?.meta?.categories || data.meta.categories.join() !== DOODLE_CATEGORIES.join() || !data.state) throw Error('Unsupported doodle model metadata.');
  const shapes = { 'conv1.weight': [8,9], 'conv1.bias': [8], 'conv2.weight': [16,72], 'conv2.bias': [16], 'fc1.weight': [64,784], 'fc1.bias': [64], 'fc2.weight': [10,64], 'fc2.bias': [10] };
  for (const [name, shape] of Object.entries(shapes)) {
    const value = data.state[name];
    if (!Array.isArray(value) || value.length !== shape[0] || (shape.length === 2
      ? value.some(row => !Array.isArray(row) || row.length !== shape[1] || row.some(n => !Number.isFinite(n)))
      : value.some(n => !Number.isFinite(n)))) throw Error(`Malformed doodle weights: ${name}.`);
  }
  return { categories: [...data.meta.categories], state: data.state };
}
export function loadDoodleModel(): Promise<DoodleModel> {
  if (!cached) cached = fetch(weightsUrl).then(response => {
    if (!response.ok) throw Error(`Doodle model could not load (${response.status}).`);
    return response.json();
  }).then(validateModel).catch(error => { cached = null; throw error; });
  return cached;
}
export function useDoodleModel(enabled = true) {
  const [model, setModel] = useState<DoodleModel | null>(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled || model) return;
    let active = true; setError('');
    loadDoodleModel().then(value => { if (active) setModel(value); }).catch(e => { if (active) setError(String(e)); });
    return () => { active = false; };
  }, [enabled, attempt, model]);
  return { model, error, retry: () => setAttempt(n => n + 1), loading: !model && !error };
}
