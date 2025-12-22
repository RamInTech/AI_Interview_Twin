import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: number;
  x: number;
  y: number;
  layer: number;
}

interface Connection {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}

// Generate neural network nodes in layers
const generateNodes = (): Node[] => {
  const nodes: Node[] = [];
  const layers = [3, 5, 6, 5, 3]; // Node count per layer
  const layerSpacing = 100 / (layers.length + 1);

  layers.forEach((count, layerIndex) => {
    const nodeSpacing = 100 / (count + 1);
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: nodes.length,
        x: layerSpacing * (layerIndex + 1),
        y: nodeSpacing * (i + 1),
        layer: layerIndex,
      });
    }
  });

  return nodes;
};

// Generate connections between adjacent layers
const generateConnections = (nodes: Node[]): Connection[] => {
  const connections: Connection[] = [];
  const layers = [...new Set(nodes.map(n => n.layer))].sort();

  for (let i = 0; i < layers.length - 1; i++) {
    const currentLayer = nodes.filter(n => n.layer === layers[i]);
    const nextLayer = nodes.filter(n => n.layer === layers[i + 1]);

    currentLayer.forEach(current => {
      // Connect to 2-3 random nodes in next layer for cleaner look
      const shuffled = [...nextLayer].sort(() => Math.random() - 0.5);
      const connectCount = Math.min(2 + Math.floor(Math.random() * 2), nextLayer.length);
      
      shuffled.slice(0, connectCount).forEach((next, idx) => {
        connections.push({
          id: `${current.id}-${next.id}`,
          x1: current.x,
          y1: current.y,
          x2: next.x,
          y2: next.y,
          delay: connections.length * 0.1,
        });
      });
    });
  }

  return connections;
};

// Neural node component
const NeuralNode = ({ node, index }: { node: Node; index: number }) => (
  <motion.circle
    cx={`${node.x}%`}
    cy={`${node.y}%`}
    r="3"
    className="fill-primary/40"
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [1, 1.3, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration: 3,
      delay: index * 0.15,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Connection line with data pulse
const ConnectionLine = ({ connection }: { connection: Connection }) => (
  <g>
    {/* Base line */}
    <motion.line
      x1={`${connection.x1}%`}
      y1={`${connection.y1}%`}
      x2={`${connection.x2}%`}
      y2={`${connection.y2}%`}
      className="stroke-primary/10"
      strokeWidth="1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.15 }}
      transition={{ duration: 1, delay: connection.delay }}
    />
    {/* Animated pulse */}
    <motion.line
      x1={`${connection.x1}%`}
      y1={`${connection.y1}%`}
      x2={`${connection.x2}%`}
      y2={`${connection.y2}%`}
      className="stroke-primary/30"
      strokeWidth="1.5"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{
        pathLength: [0, 1],
        opacity: [0, 0.5, 0],
      }}
      transition={{
        duration: 2,
        delay: connection.delay + Math.random() * 2,
        repeat: Infinity,
        repeatDelay: 3 + Math.random() * 4,
        ease: "easeInOut",
      }}
    />
  </g>
);

// Floating data particle
const DataParticle = ({ index }: { index: number }) => {
  const startX = 5 + Math.random() * 20;
  const startY = 20 + Math.random() * 60;
  
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-primary/50"
      style={{ left: `${startX}%`, top: `${startY}%` }}
      animate={{
        x: [0, 200, 400],
        y: [0, -30 + Math.random() * 60, 0],
        opacity: [0, 0.6, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        delay: index * 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Subtle glow effect
const GlowOrb = ({ x, y, size, delay }: { x: string; y: string; size: number; delay: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/5 blur-3xl"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      opacity: [0.3, 0.5, 0.3],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 8,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

export default function AnimatedBackground() {
  const nodes = useMemo(() => generateNodes(), []);
  const connections = useMemo(() => generateConnections(nodes), [nodes]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, hsl(var(--primary) / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, hsl(var(--primary) / 0.05) 0%, transparent 50%)
          `,
        }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Soft glow orbs */}
      <GlowOrb x="20%" y="30%" size={300} delay={0} />
      <GlowOrb x="60%" y="50%" size={250} delay={2} />

      {/* Neural network visualization */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Connections */}
        {connections.map(connection => (
          <ConnectionLine key={connection.id} connection={connection} />
        ))}
        
        {/* Nodes */}
        {nodes.map((node, index) => (
          <NeuralNode key={node.id} node={node} index={index} />
        ))}
      </svg>

      {/* Floating data particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <DataParticle key={i} index={i} />
      ))}

      {/* Minimal grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
    </div>
  );
}
