import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface ModuleNetworkProps {
  progress: number; // 0 to 1
  filePath: string;
}

export const ModuleNetwork: React.FC<ModuleNetworkProps> = ({ progress, filePath }) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(filePath)
      .then((res) => res.json())
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load network dataset:', err);
        setLoading(false);
      });
  }, [filePath]);

  if (loading || !graphData) {
    return (
      <div className="flex items-center justify-center h-96 bg-[#0B0F19] rounded-xl border border-[#1E293B]">
        <div className="text-[#06B6D4] animate-pulse">Načítání neuronové sítě...</div>
      </div>
    );
  }

  // Filter nodes based on challenge progress
  const totalNodes = graphData.nodes.length;
  const showEdge = 1 / totalNodes;
  
  // Mark nodes to show or hide
  const visibleNodes = graphData.nodes.filter((_node: any, index: number) => {
    const edge = showEdge + index * showEdge;
    return progress >= edge;
  });

  const visibleNodeIds = new Set(visibleNodes.map((n: any) => n.id));

  // Filter links so both source and target are visible
  const visibleLinks = graphData.links.filter((link: any) => {
    // dataset links are indexes, but some datasets might refer to IDs.
    // In our dataset.json, source/target are indices in nodes array
    // Let's support both index referencing and ID referencing safely:
    const sourceNode = graphData.nodes[link.source] || graphData.nodes.find((n: any) => n.id === link.source);
    const targetNode = graphData.nodes[link.target] || graphData.nodes.find((n: any) => n.id === link.target);
    
    if (!sourceNode || !targetNode) return false;
    return visibleNodeIds.has(sourceNode.id) && visibleNodeIds.has(targetNode.id);
  }).map((link: any) => {
    // ECharts uses names or IDs for links. We will link by name or ID.
    const sourceNode = graphData.nodes[link.source] || graphData.nodes.find((n: any) => n.id === link.source);
    const targetNode = graphData.nodes[link.target] || graphData.nodes.find((n: any) => n.id === link.target);
    return {
      source: sourceNode.name,
      target: targetNode.name,
    };
  });

  // Prepare nodes data for ECharts
  const echartNodes = visibleNodes.map((node: any, index: number) => {
    // Make the nodes look beautiful: modern neon colors
    // Node size should scale with symbolSize, category 0 gets cyan, others purple
    const isSpecial = index < 5;
    return {
      id: node.name,
      name: node.name,
      // Scale coordinates to fit graph layout nicely
      x: node.x * 300,
      y: node.y * 300,
      symbolSize: Math.max(12, node.symbolSize * 0.8),
      itemStyle: {
        color: isSpecial ? '#06B6D4' : '#8B5CF6',
        shadowBlur: 10,
        shadowColor: isSpecial ? 'rgba(6, 182, 212, 0.6)' : 'rgba(139, 92, 246, 0.6)',
      },
      label: {
        show: progress > 0.6, // Only show labels when graph is detailed
        position: 'right',
        color: '#E2E8F0',
        fontSize: 10,
      }
    };
  });

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: '#334155',
      textStyle: {
        color: '#F8FAFC',
        fontFamily: 'var(--font-sans)',
      },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<div style="padding: 4px 8px;">
            <strong style="color: #06B6D4;">${params.data.name}</strong><br/>
            Neuronový uzel splněné výzvy
          </div>`;
        }
        return '';
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        data: echartNodes,
        links: visibleLinks,
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: '#ffffff',
        },
        lineStyle: {
          color: '#334155',
          curveness: 0.2,
          width: 1.5,
          opacity: 0.5,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3.5,
            color: '#06B6D4',
            opacity: 0.9,
          }
        }
      }
    ]
  };

  return (
    <div className="w-full h-full glass-card flex flex-col">
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Síťování neuronů</h3>
          <p className="text-xs text-[#94A3B8]">Vaše pohybová aktivita spojuje neuronové uzly v lidském mozku.</p>
        </div>
        <div className="bg-[#1E293B] border border-[#334155] rounded-full px-3 py-1 text-xs text-[#06B6D4] font-semibold">
          Propojeno: {Math.round(progress * 100)} % ({visibleNodes.length} / {totalNodes} uzlů)
        </div>
      </div>

      <div className="w-full bg-[#070A13] p-2 rounded-xl border border-[#1E293B] relative" style={{ height: '400px' }}>
        <ReactECharts
          option={option}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
};
