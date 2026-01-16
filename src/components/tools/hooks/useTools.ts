export function useTools() {
  const typeBadgeColor = (type: string) => {
  switch (type) {
    case 'web':
      return 'bg-blue-700 text-blue-100';
    case 'agent':
      return 'bg-green-700 text-green-100';
    case 'system':
      return 'bg-purple-700 text-purple-100';
    default:
      return 'bg-neutral-700 text-neutral-200';
  }
}

  return { typeBadgeColor };
}
