import * as THREE from "three";
import { ObjectArrow, ObjectAxes } from "./custom_objects";
import { vec3 } from "gl-matrix/esm";

/**
 * This class is responsible for the scene that shows the main visualization
 * 
 * Other SceneWrappers could for example visualize:
 * - a sphere where the user can select a direction
 * - a deformed sphere that visualizes equivalent energy
 */
class SceneWrapperVisualization {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
    }

    initialize() {
        this.initializeLight();
        this.initializeAxesArrows();
        this.initializePlane();
        this.initializeBodies();
    }

    initializeExampleCube() {

        var geometry = new THREE.BoxGeometry();
        var material = new THREE.MeshBasicMaterial({
            color: 0x00ff00
        });
        this.example_cube_mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.example_cube_mesh);
        //this.renderer.render(this.scene, this.camera);
    }

    initializeLight() {
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(0, 0, 0);
        this.camera.add(this.directionalLight);

        this.directionalLightTarget = new THREE.Object3D();
        this.camera.add(this.directionalLightTarget);
        this.directionalLightTarget.position.set(0, 0, -1);
        this.directionalLight.target = this.directionalLightTarget;

        const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(ambientLight);
    }

    initializeAxesArrows() {
        var position = vec3.fromValues(-4, -4, 0);
        var length = 8;
        var radius = 0.02;
        var cone_radius_factor = 5.0;
        var cone_fraction = 0.05;
        this.objectAxes = new ObjectAxes(position, length, radius, cone_radius_factor, cone_fraction);
        this.objectAxes.addToScene(this.scene);
    }

    initializePlane() {
        this.plane_geometry = new THREE.PlaneGeometry(8, 8);
        this.plane_material = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
        this.plane_material.transparent = true;
        this.plane_material.opacity = 0.5;
        this.plane_mesh = new THREE.Mesh(this.plane_geometry, this.plane_material);
        this.scene.add(this.plane_mesh);
    }


    /**
    * Generates the 3 spheres with radius 1
    */
    initializeBodies() {
        var radius = 1.0;

        this.primary_geometry = new THREE.SphereGeometry(radius);
        this.primary_material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.primary_mesh = new THREE.Mesh(this.primary_geometry, this.primary_material);
        this.primary_mesh.position.set(1, 0, 0);
        this.scene.add(this.primary_mesh);

        this.secondary_geometry = new THREE.SphereGeometry(radius);
        this.secondary_material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.secondary_mesh = new THREE.Mesh(this.secondary_geometry, this.secondary_material);
        this.secondary_mesh.position.set(-1, 0, 0);
        this.scene.add(this.secondary_mesh);

        this.center_geometry = new THREE.SphereGeometry(radius);
        this.center_material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        this.center_mesh = new THREE.Mesh(this.center_geometry, this.center_material);
        this.center_mesh.position.set(0, 0, 0);
        this.scene.add(this.center_mesh);
    }
}

export { SceneWrapperVisualization };