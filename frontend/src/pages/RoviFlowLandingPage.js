import React from 'react';
import { Helmet } from 'react-helmet-async';

export const RoviFlowLandingPage = () => {
  const landingUrl = `${process.env.PUBLIC_URL || ''}/landing-page-rovi-flow.html`;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020617]">
      <Helmet>
        <title>ROVI Flow - Ecosistema comercial para brokers</title>
        <meta
          name="description"
          content="ROVI Flow: ecosistema comercial para brokers, agencias y equipos inmobiliarios con CRM, automatizaciones y operación comercial."
        />
      </Helmet>
      <iframe
        title="ROVI Flow Landing"
        src={landingUrl}
        className="block h-full w-full border-0"
      />
    </div>
  );
};

export default RoviFlowLandingPage;
