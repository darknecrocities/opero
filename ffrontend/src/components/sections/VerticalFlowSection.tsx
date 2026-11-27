import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VERTICAL_FLOW_STEPS } from '../../data/showcaseContent';
import { FeatureMotionIcon } from '../icons/FeatureMotionIcon';

export const VerticalFlowSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 80%', 'end 60%'],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0.08, 1]);

  return (
    <section
      id="flow"
      ref={sectionRef}
      aria-label="From click to manual"
      className="mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-10 pt-16 sm:pt-20 pb-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-[480px] mx-auto mb-9 sm:mb-11"
      >
        <h2 className="m-0 text-[28px] sm:text-[38px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#172334]">
          From click to manual.
        </h2>
        <p className="m-0 mt-2.5 text-[14.5px] text-[#68778B]">
          Five quiet steps from live work to a verified guide.
        </p>
      </motion.div>

      <div className="relative">
        <div
          aria-hidden="true"
          className="hidden lg:block absolute top-[62px] left-12 right-12 h-[2px] bg-[#E1E8F0]"
        >
          <motion.div
            style={{ scaleX: lineScale }}
            className="h-full origin-left bg-[#247BFA]"
          />
        </div>

        <div className="flex lg:grid lg:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-2 lg:pb-0 relative z-10">
          {VERTICAL_FLOW_STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="feature-card px-5 py-6 w-[72vw] max-w-[240px] lg:w-auto lg:max-w-none shrink-0 snap-center flex flex-col items-center text-center"
            >
              <div className="h-[78px] flex items-center justify-center mb-3">
                <FeatureMotionIcon id={step.iconId} size="md" />
              </div>
              <span className="mono-tabular text-[11px] font-semibold text-[#247BFA]">
                {step.number}
              </span>
              <h3 className="m-0 mt-1 text-[16px] font-bold text-[#172334]">{step.title}</h3>
              <p className="m-0 mt-1 text-[13px] text-[#68778B]">{step.caption}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
