import { Object3DNode } from '@react-three/fiber';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: Object3DNode<THREE.Group, typeof THREE.Group>;
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
      meshBasicMaterial: Object3DNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
      color: Object3DNode<THREE.Color, typeof THREE.Color>;
    }
  }
}

export {};
