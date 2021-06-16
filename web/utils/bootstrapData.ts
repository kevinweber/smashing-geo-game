// eslint-disable-next-line import/no-extraneous-dependencies
import { useMemo } from 'preact/hooks';
import { BootstrapData } from './types';

function getInitialBootstrapData() {
  return JSON.parse(document.getElementById('bootstrap-data').innerHTML);
}

export function useInitialBootstrapData() {
  return useMemo<BootstrapData>(getInitialBootstrapData, []);
}
