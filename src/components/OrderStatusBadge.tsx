const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  picked_up: 'bg-orange-100 text-orange-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-200 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
