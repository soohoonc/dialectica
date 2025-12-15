"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import type { GraphData, EdgeType, OntologyType } from "@/lib/graph";

interface ForceGraphProps {
  data: GraphData;
  className?: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  type: OntologyType;
  year?: number;
  connectionCount: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  type: EdgeType;
}

// Edge styles based on relationship type
const edgeStyles: Record<EdgeType, { stroke: string; dasharray: string }> = {
  influences: { stroke: "currentColor", dasharray: "" },
  contradicts: { stroke: "currentColor", dasharray: "5,5" },
  synthesizes: { stroke: "currentColor", dasharray: "" },
  wiki_link: { stroke: "currentColor", dasharray: "2,2" },
  authored: { stroke: "currentColor", dasharray: "" },
  located_in: { stroke: "currentColor", dasharray: "" },
  during_period: { stroke: "currentColor", dasharray: "" },
  child_of: { stroke: "currentColor", dasharray: "" },
  created: { stroke: "currentColor", dasharray: "" },
};

export function ForceGraph({
  data,
  className = "",
}: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const { width, height } = dimensions;

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length || width === 0 || height === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create container for zoom
    const container = svg.append("g");

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Prepare data
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
    }));

    // Scale font size by connection count
    const fontSizeScale = d3
      .scaleLinear()
      .domain([0, d3.max(nodes, (d) => d.connectionCount) || 1])
      .range([11, 18]);

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => (d as SimNode).title.length * 3.5 + 10));

    // Draw edges
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "var(--border)")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => edgeStyles[d.type]?.dasharray || "");

    // Draw edge labels for relationship type (on hover)
    const linkLabels = container
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "var(--muted-foreground)")
      .attr("text-anchor", "middle")
      .attr("opacity", 0)
      .text((d) => d.type.replace("_", " "));

    // Draw nodes
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node text labels (replacing circles)
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", (d) => `${fontSizeScale(d.connectionCount)}px`)
      .attr("fill", "var(--foreground)")
      .attr("class", "select-none")
      .text((d) => d.title);

    // Event handlers
    node
      .on("click", (event, d) => {
        event.stopPropagation();
        const prefix = d.type === "page" ? "p" : d.type.charAt(0);
        router.push(`/${prefix}/${d.id}`);
      })
      .on("mouseover", function (event, d) {
        setHoveredNode(d);
        setTooltipPos({ x: event.pageX, y: event.pageY });

        // Highlight connected edges
        link
          .attr("stroke-opacity", (l) =>
            (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id
              ? 1
              : 0.1
          )
          .attr("stroke-width", (l) =>
            (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id
              ? 2.5
              : 1.5
          );

        // Show link labels for connected edges
        linkLabels.attr("opacity", (l) =>
          (l.source as SimNode).id === d.id || (l.target as SimNode).id === d.id
            ? 0.8
            : 0
        );

        // Fade other nodes
        node.attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const isConnected = links.some(
            (l) =>
              ((l.source as SimNode).id === d.id && (l.target as SimNode).id === n.id) ||
              ((l.target as SimNode).id === d.id && (l.source as SimNode).id === n.id)
          );
          return isConnected ? 1 : 0.3;
        });
      })
      .on("mouseout", function () {
        setHoveredNode(null);
        link.attr("stroke-opacity", 0.6).attr("stroke-width", 1.5);
        linkLabels.attr("opacity", 0);
        node.attr("opacity", 1);
      });

    // Tick function
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      linkLabels
        .attr("x", (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
        .attr("y", (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, router]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-background"
      />
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none bg-popover border border-border rounded-md shadow-md p-3 max-w-xs"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 60,
          }}
        >
          <p className="font-semibold">{hoveredNode.title}</p>
          <p className="text-sm text-muted-foreground">
            {hoveredNode.type} {hoveredNode.year ? `(${hoveredNode.year < 0 ? `${Math.abs(hoveredNode.year)} BCE` : hoveredNode.year})` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hoveredNode.connectionCount} connections
          </p>
        </div>
      )}
    </div>
  );
}
