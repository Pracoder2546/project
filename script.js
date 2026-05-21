const socket = io();

const localVideo = document.getElementById("localVideo");

const remoteVideo = document.getElementById("remoteVideo");

let localStream;

let peer;

let partnerId;

const servers = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

async function startCamera() {

    localStream = await navigator.mediaDevices.getUserMedia({

        video: true,
        audio: true
    });

    localVideo.srcObject = localStream;
}

startCamera();

socket.on("start-call", async data => {

    partnerId = data.partner;

    createPeer();

    localStream.getTracks().forEach(track => {

        peer.addTrack(track, localStream);
    });

    if (data.initiator) {

        const offer = await peer.createOffer();

        await peer.setLocalDescription(offer);

        socket.emit("signal", {

            to: partnerId,

            signal: offer
        });
    }
});

socket.on("signal", async data => {

    if (data.signal.type === "offer") {

        await peer.setRemoteDescription(

            new RTCSessionDescription(data.signal)
        );

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit("signal", {

            to: data.from,

            signal: answer
        });

    }

    else if (data.signal.type === "answer") {

        await peer.setRemoteDescription(

            new RTCSessionDescription(data.signal)
        );
    }

    else {

        try {

            await peer.addIceCandidate(

                new RTCIceCandidate(data.signal)
            );

        } catch (err) {

            console.log(err);
        }
    }
});

function createPeer() {

    peer = new RTCPeerConnection(servers);

    peer.onicecandidate = event => {

        if (event.candidate) {

            socket.emit("signal", {

                to: partnerId,

                signal: event.candidate
            });
        }
    };

    peer.ontrack = event => {

        remoteVideo.srcObject = event.streams[0];
    };
}