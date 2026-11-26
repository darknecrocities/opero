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
}

export const FeatureMotionIcon: React.FC<FeatureMotionIconProps> = ({ id }) => {
  const reduced = Boolean(useReducedMotion());

  switch (id) {
    case 'capture':
      return <CaptureMotionIcon reduced={reduced} />;
    case 'ocr':
      return <OcrMotionIcon reduced={reduced} />;
    case 'studio':
      return <StudioMotionIcon reduced={reduced} />;
    case 'annotations':
      return <AnnotationsMotionIcon reduced={reduced} />;
    case 'templates':
      return <TemplatesMotionIcon reduced={reduced} />;
    case 'multilingual':
      return <MultilingualMotionIcon reduced={reduced} />;
    case 'versions':
      return <VersionsMotionIcon reduced={reduced} />;
    case 'export':
      return <ExportMotionIcon reduced={reduced} />;
    case 'menubar':
      return <MenuBarMotionIcon reduced={reduced} />;
    case 'local':
      return <LocalMotionIcon reduced={reduced} />;
  }
};
