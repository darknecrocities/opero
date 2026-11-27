import React from 'react';
import { useReducedMotion } from 'framer-motion';
import type { FeatureMotionIconId } from '../../types/showcase';
import {
  AnnotationsMotionIcon,
  CaptureMotionIcon,
  OcrMotionIcon,
  StudioMotionIcon,
  TemplatesMotionIcon,
} from './CaptureAndAiIcons';
import {
  ExportMotionIcon,
  LocalMotionIcon,
  MenuBarMotionIcon,
  MultilingualMotionIcon,
  VersionsMotionIcon,
} from './WorkflowAndPrivacyIcons';

export interface FeatureMotionIconProps {
  id: FeatureMotionIconId;
  morphed?: boolean;
  size?: 'md' | 'lg';
}

export const FeatureMotionIcon: React.FC<FeatureMotionIconProps> = ({
  id,
  morphed = false,
  size = 'lg',
}) => {
  const reduced = Boolean(useReducedMotion());
  const props = { reduced, morphed, size };

  switch (id) {
    case 'capture':
      return <CaptureMotionIcon {...props} />;
    case 'ocr':
      return <OcrMotionIcon {...props} />;
    case 'studio':
      return <StudioMotionIcon {...props} />;
    case 'annotations':
      return <AnnotationsMotionIcon {...props} />;
    case 'templates':
      return <TemplatesMotionIcon {...props} />;
    case 'multilingual':
      return <MultilingualMotionIcon {...props} />;
    case 'versions':
      return <VersionsMotionIcon {...props} />;
    case 'export':
      return <ExportMotionIcon {...props} />;
    case 'menubar':
      return <MenuBarMotionIcon {...props} />;
    case 'local':
      return <LocalMotionIcon {...props} />;
  }
};
