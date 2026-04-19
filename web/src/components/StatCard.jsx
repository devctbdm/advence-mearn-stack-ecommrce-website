

const StatCard = ({ title, value, icon, color, trend }) => {
    return (
        <div
            className={`rounded-lg  shadow-sm p-4 flex items-center ${trend ? 'relative' : ''}`}>
            <div className="mr-4">{icon}</div>
            <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-700">{title}</h3>
                <div className="flex items-center">
                    <p className={`text-lg font-semibold text-${color}-600`}>
                        {value}
                    </p>
                    {trend && (
                        <div
                            className={`ml-2 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <span
                                className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trend > 0 ? '+' : ''}
                                {trend}%
                            </span>
                            <span className="ml-1">{icon}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default StatCard;