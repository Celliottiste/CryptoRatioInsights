import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchLongShortRatios, LongShortRatio } from './binance-api';
import { Loader, Segment, ButtonGroup, Button } from 'semantic-ui-react';
import htmlToImage from 'html-to-image';

interface LongShortRatioChartProps {
    symbol: string;
}

const LongShortRatioChart: React.FC<LongShortRatioChartProps> = ({ symbol }) => {
    const [data, setData] = useState<LongShortRatio[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const chartContainerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const longShortRatios = await fetchLongShortRatios(symbol, '5m');
            setData(longShortRatios);
            setLoading(false);
        };
        fetchData();
        const interval = setInterval(fetchData, 5 * 60000); // Update every minute
        return () => clearInterval(interval);
    }, [symbol]);

    const handleAnimationEnd = () => {
        setLoading(false);
    };

    const strokeColor = () => {
        if (data.length === 0) return 'gray';
        const lastValue = data[data.length - 1].longShortRatio;
        return lastValue > 1 ? 'green' : 'red';
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const exportAsPicture = async (download: boolean) => {
        const container = chartContainerRef.current;
        if (!container) return;
        const dataUrl = await htmlToImage.toPng(container);

        if (download) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${symbol}.png`;
            link.click();
        } else {
            try {
                const dataUrlBlob = await fetch(dataUrl).then((res) => res.blob());
                await navigator.clipboard.write([
                    new ClipboardItem({
                        [dataUrlBlob.type]: dataUrlBlob,
                    }),
                ]);
                alert('Image copied to clipboard');
            } catch (error) {
                console.error('Failed to copy image to clipboard', error);
                alert('Failed to copy image to clipboard');
            }
        }
    };

    return (
        <div ref={chartContainerRef}>
            <Segment>
                <h1>{symbol}</h1>
                {loading || data.length === 0 ? (
                    <Loader active inline="centered" size="small">
                        Loading data...
                    </Loader>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatDate}
                                angle={-45}
                                textAnchor="end"
                            />
                            <YAxis />
                            <Tooltip />
                            <Line
                                name={''}
                                type="monotone"
                                dataKey="longShortRatio"
                                stroke={strokeColor()}
                                dot={false}
                                onTransitionEnd={handleAnimationEnd}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
                <ButtonGroup>
                    <Button icon="download" onClick={() => exportAsPicture(true)} />
                    <Button icon="copy" onClick={() => exportAsPicture(false)} />
                </ButtonGroup>
            </Segment>
        </div>
    );
};

export default LongShortRatioChart;