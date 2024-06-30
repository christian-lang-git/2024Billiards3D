import * as Constants from "@/components/utility/constants";
import { getThetaFromCartesian, getPhiFromCartesian } from "@/components/utility/utility";
import { vec3 } from "gl-matrix/esm";

class SimulationParameters {
    constructor() {
        //physics
        this.mu = 0.1;//mass of secondary
        this.angular_velocity = 1;//n in the equations of motion
        this.seed_direction_x = 1;//used for computation
        this.seed_direction_y = 0;//used for computation
        this.seed_direction_z = 1;//used for computation
        this.seed_direction_theta_frac = 0;//used for displaying in grid view
        this.seed_direction_phi_frac = 0;//used for displaying in grid view
        this.seed_direction_theta_radians = 0;//TODO: used for displaying to user?
        this.seed_direction_phi_radians = 0;//TODO: used for displaying to user?
        this.seed_position_x = 0;
        this.seed_position_y = 0;
        this.seed_energy = 0.25;//used to calculate seed velocity - this is either the hamiltonian or the magnitude depending on use_constant_velocity
        this.use_constant_velocity = false;//if set to false, use constant hamiltonian
        //RK4
        this.max_steps = 15000;
        this.step_size = 0.001;
        this.termination_method = Constants.TERMINATION_METHOD_FIRST_RETURN;

        //cosmetics
        //camera
        this.camera_near_plane = 0.001;
        this.camera_far_plane = 25;
        //bodies
        this.scale_bodies_by_volume = true;
        this.max_radius_bodies = 0.05;
        //center of mass
        this.radius_center_of_mass = 0.01;
        //clicked position
        this.radius_clicked_position = 0.025;
        //tubes
        this.tube_radius = 0.0025;
        this.tube_num_sides = 20;
        this.tube_num_segments = 20000;
        this.tube_segment_length = 0.001;
        this.tube_max_segments = 10000;
        this.tube_only_show_successful_returns = true;

        this.activeBehavior = Constants.BEHAVIOR_CONTROL_CAMERA;
        this.activeBehaviorLastFrame = Constants.BEHAVIOR_CONTROL_CAMERA;
        this.rendering_texture_mode = Constants.TEXTURE_MODE_SPECIALIZED;
        this.rendering_specialized_mode = Constants.TEXTURE_MODE_SPECIALIZED_GRAVITATIONAL_FORCE;
        this.return_layer = Constants.LAYER_INDEX_FIRST_RETURN;
        this.rendering_raw_mode = Constants.OFFSCREEN_RENDERER_GRAVITATIONAL_FORCE;
        this.rendering_raw_mode_layer = 0;
        this.rendering_raw_mode_x_texture_index = 0;
        this.rendering_raw_mode_y_texture_index = 0;
        this.rendering_ftle_type = Constants.FTLE_TYPE_PSFTLE;

        this.scalar_min = 0.0;
        this.scalar_max = 1.0;
        this.opacity = 1.0;

        this.linkedViewsActive = true;
        this.auxGridDirection = Constants.AUX_GRID_DIRECTION_THETA_DOWN_PHI_RIGHT;
        this.rendering_scale_vertices = false;

        this.print();
    }

    getPrimaryMass() {
        return (1 - this.mu);
    }

    getSecondaryMass() {
        return this.mu;
    }

    getPrimaryX() {
        return -this.mu;
    }

    getSecondaryX() {
        return (1 - this.mu);
    }

    getPrimaryRadius() {
        if (this.scale_bodies_by_volume)
            return Math.pow((3 / (4 * Math.PI) * this.getPrimaryMass()), (1 / 3)) * this.max_radius_bodies;
        else
            return this.getPrimaryMass() * this.max_radius_bodies;
    }

    getSecondaryRadius() {
        //scale by radius
        //return (this.mu) * this.max_radius_bodies;
        //scale by volume
        if (this.scale_bodies_by_volume)
            return Math.pow((3 / (4 * Math.PI) * this.getSecondaryMass()), (1 / 3)) * this.max_radius_bodies;
        else
            return this.getSecondaryMass() * this.max_radius_bodies;
    }

    getCenterOfMassRadius() {
        return this.radius_center_of_mass;
    }

    getClickedPositionRadius(){
        return this.radius_clicked_position;
    }

    getSphereVolume(radius) {
        return (4 / 3) * Math.PI * radius * radius * radius;
    }

    print() {
        var primary_radius = this.getPrimaryRadius();
        var secondary_radius = this.getSecondaryRadius();
        var primary_radius_unscaled = this.getPrimaryRadius() / this.max_radius_bodies;
        var secondary_radius_unscaled = this.getSecondaryRadius() / this.max_radius_bodies;
        var primary_volume = this.getSphereVolume(primary_radius);
        var secondary_volume = this.getSphereVolume(secondary_radius);
        var primary_volume_unscaled = this.getSphereVolume(primary_radius_unscaled);
        var secondary_volume_unscaled = this.getSphereVolume(secondary_radius_unscaled);
        console.log("primary_radius", primary_radius);
        console.log("secondary_radius", secondary_radius);
        console.log("primary_radius_unscaled", primary_radius_unscaled);
        console.log("secondary_radius_unscaled", secondary_radius_unscaled);
        console.log("primary_volume", primary_volume);
        console.log("secondary_volume", secondary_volume);
        console.log("primary_volume_unscaled", primary_volume_unscaled);
        console.log("secondary_volume_unscaled", secondary_volume_unscaled);
    }

    setSeedDirectionAnglesFromFrac(x_frac, y_frac){
        //switch directions
        if(this.auxGridDirection == Constants.AUX_GRID_DIRECTION_THETA_DOWN_PHI_RIGHT){
            var tmp_x = x_frac;
            var tmp_y = y_frac;
            x_frac = 1-tmp_y;
            y_frac = tmp_x;
        }else if(this.auxGridDirection == Constants.AUX_GRID_DIRECTION_THETA_RIGHT_PHI_UP){
            //do nothing
        }else{
            console.error("setSeedDirectionAnglesFromFrac: unkonw auxGridDirection", this.auxGridDirection);
        }

        //calculate values
        var theta_radians = Math.PI * x_frac;
        var phi_radians = 2.0 * Math.PI * y_frac;

        var dir_x = Math.sin(theta_radians) * Math.cos(phi_radians);
        var dir_y = Math.sin(theta_radians) * Math.sin(phi_radians);
        var dir_z = Math.cos(theta_radians);

        //set values
        this.seed_direction_theta_frac = x_frac;
        this.seed_direction_phi_frac = y_frac;
        this.seed_direction_theta_radians = theta_radians;
        this.seed_direction_phi_radians = phi_radians;
        this.seed_direction_x = dir_x;
        this.seed_direction_y = dir_y;
        this.seed_direction_z = dir_z;
    }

    setSeedDirection(dir_x, dir_y, dir_z){
        //normalize input
        var dir = vec3.fromValues(dir_x, dir_y, dir_z);
        vec3.normalize(dir, dir);
        dir_x = dir[0];
        dir_y = dir[1];
        dir_z = dir[2];

        //calculate values
        var theta_radians = getThetaFromCartesian(dir_x, dir_y, dir_z);
        var phi_radians = getPhiFromCartesian(dir_x, dir_y, dir_z);
        if(phi_radians < 0){
            phi_radians += 2 * Math.PI;
        }

        var x_frac = theta_radians / Math.PI;
        var y_frac = phi_radians / (2*Math.PI);

        //console.warn("x_frac", x_frac, "y_frac", y_frac);

        //set values
        this.seed_direction_theta_frac = x_frac;
        this.seed_direction_phi_frac = y_frac;
        this.seed_direction_theta_radians = theta_radians;
        this.seed_direction_phi_radians = phi_radians;
        this.seed_direction_x = dir_x;
        this.seed_direction_y = dir_y;
        this.seed_direction_z = dir_z;
    }

    static CreateOrGetInstance(){
        if(SimulationParameters.instance){
            return SimulationParameters.instance;
        }
        SimulationParameters.instance = new SimulationParameters();
        return SimulationParameters.instance;
    }
}

export { SimulationParameters };