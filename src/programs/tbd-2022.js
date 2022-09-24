const EventEmitter = require('events');

module.exports = () => (logger, config, arena, sensors, actuators, utils, helpers) => {
  const eventEmitter = new EventEmitter();
  const { averageMeasurements, getAngleDistance } = utils.sensor.lidar;
  const { constrain } = utils.robotlib;
  const { calculateDistance, deg2rad } = utils.robotlib.math;
  const { scan } = helpers;
  const { lidar } = sensors;
  const { motion } = actuators;

  const minTrackWidth = 600;
  const maxTrackWidth = 1200;
  const maxSpeed = 300;
  const speed = maxSpeed - 100;
  const Kp = 0.25;
  const lidarData = {};
  const objectSightings = [];
  let bottleCounter = 0;
  let canCounter = 0;
  let desiredWallDistance;
  let interval;

  async function start() {
    motion.appendPose({ x: 0, y: 2100, phi: 0 });
    motion.setTrackPose(true);

    lidar.on('data', onLidarData);

    const startMeasurements = averageMeasurements(await scan(1000));
    desiredWallDistance = getAngleDistance(startMeasurements, 90);

    interval = setInterval(wallFollowing, 50);
  }

  function stop() {
    clearInterval(interval);
    lidar.off('data', onLidarData);
    motion.stop(true);

    const filteredObjectSightings = objectSightings.reduce((acc, object) => {
      const isSameObject = !!acc.find(foundObject => calculateDistance(foundObject, object) <= 180);

      if (!isSameObject) {
        acc.push(object);
      }

      return acc;
    }, []);

    const groupedSightings = objectSightings.reduce((acc, object) => {
      if (!acc.length) {
        acc.push([]);
        acc[0].push(object);
      } else {
        for (let i = 0; i < acc.length; i += 1) {
          if (!acc[i].length) {
            continue;
          }

          const averageObjectPose = {
            x: acc[i].reduce((acc, { x }) => acc + x, 0) / acc[i].length,
            y: acc[i].reduce((acc, { y }) => acc + y, 0) / acc[i].length,
          };

          const isSameObject = calculateDistance(averageObjectPose, object) <= 100;

          if (!isSameObject) {
            if (i === acc.length - 1) {
              acc.push([]);
              acc[acc.length - 1].push(object);
            }

            continue;
          }

          acc[i].push(object);
        }
      }

      return acc;
    }, [])
    .filter(sightings => !!sightings.length);

    groupedSightings.forEach(sightings => {
      let largestDistance = 0;

      sightings.forEach(a => {
        sightings.forEach(b => {
          const dist = calculateDistance(a, b);
          largestDistance = Math.max(largestDistance, dist);
        });
      });

      console.log('i', largestDistance);

      if (largestDistance > 70) {
        bottleCounter += 1;
      } else {
        canCounter += 1;
      }
    });

    console.log(`Totaal aantal objecten: ${filteredObjectSightings.length}`);
    console.log(`Totaal aantal flessen: ${bottleCounter}`);
    console.log(`Totaal aantal blikken: ${canCounter}`);
  }

  function wallFollowing() {
    const distanceToWall = lidarData[90] || lidarData[89] || lidarData[91];

    // keep wallDistance to right
    const error =  distanceToWall - desiredWallDistance;
    const leftSpeed = constrain(Math.round(speed + (error * Kp)), 0, maxSpeed);
    const rightSpeed = constrain(Math.round(speed - (error * Kp)), 0, maxSpeed);

    motion.speedLeftRight(leftSpeed, rightSpeed);

    // track sightings
    const distanceToObject = lidarData[270] || lidarData[269] || lidarData[271];

    if (distanceToObject <= maxTrackWidth) {
      const pose = motion.getPose();

      objectSightings.push({
        x: pose.x + Math.cos(pose.phi + deg2rad(270)) * distanceToObject,
        y: pose.y + Math.sin(pose.phi + deg2rad(270)) * distanceToObject,
      });
    }

    // are we at the end of the wall?
    if (distanceToWall > minTrackWidth) {
      eventEmitter.emit('mission_complete');
    }
  }

  function onLidarData({ angle, distance }) {
    const a = parseInt(Math.round(angle), 10);

    if (distance) {
      lidarData[a] = distance;
    }
  }

  return {
    events: eventEmitter,
    start,
    stop,
  };
};
