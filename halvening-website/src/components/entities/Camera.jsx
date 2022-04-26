import { Players, Rocks } from '../../components';
import React, { useState, useEffect, useRef, forwardRef } from "react";

//possible actions
const directions = {
    up: "up",
    down: "down",
    left: "left",
    right: "right"
}

const controls = {
    openChat: "openChat"
}

const cameraKeys = {
    //arrows
    "ArrowUp": directions.up,
    "ArrowLeft": directions.left,
    "ArrowRight": directions.right,
    "ArrowDown": directions.down,

    //wasd
    "KeyW": directions.up,
    "KeyA": directions.left,
    "KeyD": directions.right,
    "KeyS": directions.down,
}

const otherKeys = {
    //chat controls
    "Enter": controls.openChat
}


let defaultHeldKeys = {
    [directions.up]: false,
    [directions.left]: false,
    [directions.right]: false,
    [directions.down]: false,
    [controls.openChat]: false
}

let heldKeys = { ...defaultHeldKeys };


const Camera = forwardRef(({ socket, focusChat }, cameraRef) => {

    const [playerData, setPlayerData] = useState(null);
    const [rockData, setRockData] = useState(null);
    const [socketId, setSocketId] = useState(null);

    const mapRef = useRef(null);

    function handleFocusOut() {
        heldKeys = { ...defaultHeldKeys };
        socket.emit("move", heldKeys)
    }

    function handleKeyDown(e) {
        updateControls(e.code, true);
    }

    function handleKeyUp(e) {
        updateControls(e.code, false);
    }

    function handleCommands(command, isPressed) {
        if (command === controls.openChat && isPressed === false) {
            focusChat();
        }
    }

    function updateControls(keyCode, isPressed) {
        if (socket == null || playerData == null) {
            return;
        }
        let direction = cameraKeys[keyCode];
        let command = otherKeys[keyCode];

        if (direction != null) {
            if (heldKeys[direction] === isPressed) {
                //sono già nella situazione giusta, non c'è bisogno di inviare nulla al server
                return;
            } else {
                //devo dire al server che sono cambiati i tasti premuti
                heldKeys[direction] = isPressed;
                socket.emit("move", heldKeys);
            }

        } else if (command != null) {
            if (heldKeys[command] === isPressed) {
                return;
            } else {
                heldKeys[command] = isPressed;
                handleCommands(command, isPressed);
            }
        }
    }

    useEffect(() => {
        socket.on("playerdata", data => {
            if (!socketId) {
                setSocketId(socket.id);
            }
            setPlayerData(data);
        });
        socket.on("rockData", data => {
            if (!socketId) {
               setSocketId(socket.id);
            }
            setRockData(data);
         });
    }, [socket])

    useEffect(() => {
        if (socketId && cameraRef) {
            setTimeout(() => cameraRef.current.focus(), 1000);
        }
    }, [socketId])

    useEffect(() => {
        const placeRocks = () => {
           let pixelSize = parseInt(
              getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
           );
  
           for (const [rockId] of Object.entries(rockData)) {
              let [x, y] = rockData[rockId]["xy"];
              let rock = document.getElementById(rockId + "-rock");
              if (rock) {
                 rock.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`;
                 rock.style.zIndex = y;
              }
           }
        }
  
        if (rockData) {
           placeRocks();
        }
  
     }, [rockData, socketId])

    useEffect(() => {
        const placeCharacters = () => {
            let pixelSize = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
            );

            let camera_left = pixelSize * 66;
            let camera_top = pixelSize * 42;

            mapRef.current.style.transform = `translate3d( ${-x * pixelSize + camera_left}px, ${-y * pixelSize + camera_top}px, 0 )`;

            for (const [currentSocketId] of Object.entries(playerData)) {
                let [x, y] = playerData[currentSocketId]["xy"];
                let facingDirection = playerData[currentSocketId]["fd"];
                let walking = playerData[currentSocketId]["wa"];
                let player = document.getElementById(currentSocketId + "-player");
                let character = document.getElementById(currentSocketId + "-character");
                if (player && character) {
                    player.style.transform = `translate3d( ${x * pixelSize}px, ${y * pixelSize}px, 0 )`;
                    player.style.zIndex = y;
                    character.setAttribute("facing", facingDirection);
                    character.setAttribute("walking", walking);
                }
            }
        }

        let x, y;
        if (playerData) {
            x = playerData[socketId]["xy"][0];
            y = playerData[socketId]["xy"][1];
        }

        if (mapRef && playerData && mapRef.current) {
            placeCharacters();
        }

    }, [playerData, mapRef, socketId])


    return (
        <div className="camera mt-5" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onBlur={handleFocusOut} ref={cameraRef} tabIndex="0">
            <div className="map pixel-art" ref={mapRef}>
                <Players playerData={playerData} localsocket={socketId} />
                <Rocks rockData={rockData} />
            </div>
        </div>
    );

});

export default Camera;