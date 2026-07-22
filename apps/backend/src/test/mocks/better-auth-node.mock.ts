export const toNodeHandler = (authInstance: any) => (req: any, res: any) => {
  if (res && typeof res.status === 'function') {
    return res.status(200).json({ status: 'ok' });
  }
  return { status: 'ok' };
};
