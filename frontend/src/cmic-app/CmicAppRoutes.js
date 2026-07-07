import React from 'react';
import { Route } from 'react-router-dom';
import { CmicAppShell } from './CmicAppShell';
import { CmicHome } from './screens/CmicHome';
import { CmicMembership } from './screens/CmicMembership';
import { CmicPayments } from './screens/CmicPayments';
import { CmicCourses } from './screens/CmicCourses';
import { CmicCredential } from './screens/CmicCredential';
import { CmicEvents } from './screens/CmicEvents';
import { CmicDirectory } from './screens/CmicDirectory';
import { CmicProfile } from './screens/CmicProfile';
import { CmicOpportunities } from './screens/CmicOpportunities';
import { CmicIndicators } from './screens/CmicIndicators';
import { CmicMore } from './screens/CmicMore';

/**
 * Rutas anidadas de la app móvil del socio CMIC.
 * Se montan en App.js bajo /cmic/app con su propio shell (sin el Layout desktop).
 */
export const cmicAppRoutes = (
  <Route path="/cmic/app" element={<CmicAppShell />}>
    <Route index element={<CmicHome />} />
    <Route path="membership" element={<CmicMembership />} />
    <Route path="payments" element={<CmicPayments />} />
    <Route path="courses" element={<CmicCourses />} />
    <Route path="credential" element={<CmicCredential />} />
    <Route path="events" element={<CmicEvents />} />
    <Route path="directory" element={<CmicDirectory />} />
    <Route path="profile" element={<CmicProfile />} />
    <Route path="opportunities" element={<CmicOpportunities />} />
    <Route path="indicators" element={<CmicIndicators />} />
    <Route path="more" element={<CmicMore />} />
  </Route>
);
