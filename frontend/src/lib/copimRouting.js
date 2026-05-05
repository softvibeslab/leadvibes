export const mergeCopimSearchParams = (currentParams, updates = {}) => {
  const next = new URLSearchParams(currentParams);

  Object.entries(updates).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'all' ||
      value === false
    ) {
      next.delete(key);
      return;
    }

    next.set(key, String(value));
  });

  return next;
};

export const buildCopimPath = (pathname, params = {}) => {
  const search = mergeCopimSearchParams('', params).toString();
  return search ? `${pathname}?${search}` : pathname;
};
