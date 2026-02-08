import React, { Suspense } from 'react';
import SkeletonPage from './SkeletonPage';

const SuspenseWrapper = ({ children }) => (
    <Suspense fallback={<SkeletonPage />}>
        {children}
    </Suspense>
);

export default SuspenseWrapper;
