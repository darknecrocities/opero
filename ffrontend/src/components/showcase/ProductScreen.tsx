import React from 'react';
import type { ProductModuleId } from '../../types/showcase';
import { DashboardScreen } from './screens/DashboardScreen';
import { CaptureCenterScreen } from './screens/CaptureCenterScreen';
import { IntelligenceScreen } from './screens/IntelligenceScreen';
import { StudioScreen } from './screens/StudioScreen';
import { TemplatesScreen } from './screens/TemplatesScreen';
import { VersionControlScreen } from './screens/VersionControlScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export interface ProductScreenProps {
  moduleId: ProductModuleId;
}

export const ProductScreen: React.FC<ProductScreenProps> = ({ moduleId }) => {
  switch (moduleId) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'capture-center':
      return <CaptureCenterScreen />;
    case 'intelligence':
      return <IntelligenceScreen />;
    case 'studio':
      return <StudioScreen />;
    case 'templates':
      return <TemplatesScreen />;
    case 'version-control':
      return <VersionControlScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
};
