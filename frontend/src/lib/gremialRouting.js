const buildUrl = (base, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
};

export const buildGremialMemberUrl = (memberId, params = {}) => buildUrl('/gremial/members', { ...params, focus: memberId });
export const buildGremialDelegationUrl = (delegationId, params = {}) => buildUrl('/gremial/delegations', { ...params, focus: delegationId });
export const buildGremialOpportunityUrl = (opportunityId, params = {}) => buildUrl('/gremial/opportunities', { ...params, focus: opportunityId });
export const buildGremialTenderUrl = (tenderId, params = {}) => buildUrl('/gremial/tenders', { ...params, focus: tenderId });
