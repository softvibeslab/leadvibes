import React from 'react';
import { Helmet } from 'react-helmet-async';

export const PremiumLandingPage = () => {
  const landingUrl = `${process.env.PUBLIC_URL || ''}/landing-page-rovi-premium.html`;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0f1a]">
      <Helmet>
        <title>ROVI - CRM Inmobiliario Premium</title>
        <meta
          name="description"
          content="ROVI - CRM inmobiliario premium para agentes de bienes raíces en Tulum. Gestiona leads, campañas y cierra más ventas con tecnología de vanguardia."
        />
      </Helmet>
      <iframe
        title="ROVI CRM Inmobiliario Premium"
        src={landingUrl}
        className="block h-full w-full border-0"
      />
    </div>
  );
};

export default PremiumLandingPage;
