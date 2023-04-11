// Copyright Epic Games, Inc. All Rights Reserved.

import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';
import { Application, PixelStreamingApplicationStyle } from '@epicgames-ps/lib-pixelstreamingfrontend-ui-ue5.2';
export const PixelStreamingApplicationStyles = new PixelStreamingApplicationStyle();
PixelStreamingApplicationStyles.applyStyleSheet();


document.body.onload = function () {
	// Example of how to set the logger level
	// Logger.SetLoggerVerbosity(10);

	// Create a config object
	const config = new Config({ useUrlParams: true });

	// Create Pixel Streaming application
	const stream = new PixelStreaming(config);
	const application = new Application({
		stream,
		onColorModeChanged: (isLightMode) => PixelStreamingApplicationStyles.setColorMode(isLightMode)
	});
	document.getElementById("playercontainer").appendChild(application.rootElement);

	const showcase = new Showcase(stream);

	// Bind example selection to the onExampleChanged function
	document.getElementById("exampleSelect").onchange = (event: Event) => { showcase.onExampleChanged(event); };


}

class Showcase {

	private _pixelStreaming: PixelStreaming;
	private _bvhMotionIntervalId: NodeJS.Timer
	private _infoElem: HTMLElement;
	private _exampleSettingsElem: HTMLElement;
	private _bvhFileLines: string[];

	constructor(pixelStreaming: PixelStreaming) {
		this._pixelStreaming = pixelStreaming;
		this._bvhMotionIntervalId = null
		this._infoElem = document.getElementById("infoinstructions") as HTMLElement;
		this._exampleSettingsElem = document.getElementById("sidebarContent") as HTMLElement;
		this._bvhFileLines = [];
		this._createGettingStartedExample();
	}

	/**
	 * Event fired for when the selection drop down containing our showcase examples changes.
	 * @param event The change event.
	 */
	onExampleChanged(event: Event): void {

		if (!event) { return; }

		const selectElement = event.target as HTMLSelectElement;
		const exampleName = selectElement.value;
		this._createExample(exampleName);
	}

	private _createExample(exampleName: string) {

		// clear example elements
		while (this._exampleSettingsElem.lastElementChild) {
			this._exampleSettingsElem.removeChild(this._exampleSettingsElem.lastElementChild);
		}

		// create the relevant example based on the string passed in
		switch (exampleName) {
			case "Send Data to UE":
				this._createSendUEDataExample();
				break;
			case "Getting Started":
				this._createGettingStartedExample();
				break;
			case "Send Commands to UE":
				this._createUECommandExample();
				break;
			case "Sharespace BVH":
				this._createBVHCommandExample();
				break;
			default:
				break;
		}
	}

	private _onCharacterClicked(characterName: string) {
		this._pixelStreaming.emitUIInteraction({ Character: characterName });
	}

	private _onSkinClicked(skinIndex: number) {
		this._pixelStreaming.emitUIInteraction({ Skin: skinIndex });
	}

	private _onResClicked(width: number, height: number) {
		this._pixelStreaming.emitCommand({ Resolution: { Width: width, Height: height } });
	}

	private _onStartMotionClicked() {
		if (this._bvhFileLines?.length == 0) {
			return;
		}
		const startBtn = document.getElementById('start-motion');
		startBtn?.setAttribute('disabled', '');
		const stopBtn = document.getElementById('stop-motion');
		stopBtn?.removeAttribute('disabled');

		this._pixelStreaming.emitUIInteraction({ type: "BVHStartMotion" });

		if (this._bvhFileLines.length > 0) {
			// Process BVH reading
			const lines = this._bvhFileLines;
			let index = 0;

			// Parse hierarchy
			while (lines[index] !== 'MOTION') {
				// Parse joint
				index++;
			}

			//this._pixelStreaming.emitUIInteraction({ type: 'BVHHierarchy', data: lines.slice(0, index).join('\n') })

			// Parse motion
			index++;
			// Read the number of frames
			const regex1 = /(\d+)/;
			const matches1 = lines[index++].match(regex1);
			const frames = matches1 ? parseInt(matches1[0]) : null;

			// Read the time frame
			const regex2 = /(\d+\.\d+)/;
			const matches = lines[index++].match(regex2);
			const timeFrame = matches ? parseFloat(matches[0]) : null;

			// Send HIERARCHY header + MOTION description with first frame
			this._pixelStreaming.emitUIInteraction({ type: 'BVHHierarchy', data: lines.slice(0, index).join('\n') })

			const motionStartIndex = index++; // skip for the first time the first frame already sent
			this._bvhMotionIntervalId = setInterval(() => {
				// Send motion frame
				this._pixelStreaming.emitUIInteraction({ type: "BVHMotionFrame", "data": lines[index++] });
				if (index == lines.length) {
					index = motionStartIndex;
				}
			}, Math.floor(timeFrame * 1000));
		}
	}

	private _onStopMotionClicked() {
		if (this._bvhFileLines?.length == 0) {
			return;
		}
		const startBtn = document.getElementById('start-motion');
		startBtn?.removeAttribute('disabled');
		const stopBtn = document.getElementById('stop-motion');
		stopBtn?.setAttribute('disabled', '');

		clearInterval(this._bvhMotionIntervalId)
		this._pixelStreaming.emitUIInteraction({ type: "BVHStopMotion" });
	}

	private _createGettingStartedExample() {
		this._infoElem.innerHTML =
			`
		<p>Welcome to the Pixel Streaming demo showcase!</p>
		<p> <u>Getting Started</u> </p>
		<ol>
			<li>Run the Unreal Engine Pixel Streaming demo project with launch args for this server, example: -PixelStreamingUrl=ws://localhost:8888.</li>
			<li>Click the "click to start" text on this page to start streaming.</li>
			<li>Use the drop down to select an example.</li>
			<li>Use control panel on the left to interact with the example.</li>
		</ol>
		`;
	}

	private _createSendUEDataExample() {

		this._infoElem.innerHTML =
			`
		<p> <u>Example: Sending data to Unreal Engine</u> </p>
		<ol>
			<li>Click the character portraits to change character.</li>
			<li>Click the skins to change character skins.</li>
		</ol>
		<p>Under the hood these interactions use the WebRTC data channel to send a data payload that we interpret on the UE side and respond to appropriately.</p>
		<p>In particular the function called to send custom data to Unreal Engine from the frontend is:</p>
		<code>pixelstreaming.emitUIInteraction(data: object | string)</code>
		`;

		const characterSelectElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(characterSelectElem);

		const sendDataTitle = document.createElement("h2");
		sendDataTitle.innerText = "Send data: ";
		characterSelectElem.appendChild(sendDataTitle);

		const characterSelectTitle = document.createElement("p");
		characterSelectTitle.innerText = "Select a character: ";
		characterSelectElem.appendChild(characterSelectTitle);

		// Make Aurora character
		const auroraElem = document.createElement("div");
		characterSelectElem.appendChild(auroraElem);
		const auroraImg = document.createElement("img");
		auroraImg.classList.add("characterBtn");
		auroraImg.src = "./images/Aurora.jpg";
		auroraImg.onclick = () => { this._onCharacterClicked("Aurora"); }
		auroraElem.appendChild(auroraImg);

		// Make Crunch character
		const crunchElem = document.createElement("div");
		characterSelectElem.appendChild(crunchElem);
		const crunchImg = document.createElement("img");
		crunchImg.classList.add("characterBtn");
		crunchImg.src = "./images/Crunch.jpg";
		crunchImg.onclick = () => { this._onCharacterClicked("Crunch"); }
		crunchElem.appendChild(crunchImg);

		// Make skin selection title
		const skinSelectTitle = document.createElement("p");
		skinSelectTitle.innerText = "Select a skin: ";
		this._exampleSettingsElem.appendChild(skinSelectTitle);

		// Make skin selection
		const skinSelectElem = document.createElement("div");
		skinSelectElem.classList.add("spaced-row");
		this._exampleSettingsElem.appendChild(skinSelectElem);

		// Make skin selection buttons

		// Skin1
		const skin1Btn = document.createElement("button");
		skin1Btn.classList.add("btn-flat");
		skin1Btn.onclick = () => { this._onSkinClicked(0); }
		skin1Btn.innerText = "Skin 1";
		skinSelectElem.appendChild(skin1Btn);

		// Skin2
		const skin2Btn = document.createElement("button");
		skin2Btn.classList.add("btn-flat");
		skin2Btn.onclick = () => { this._onSkinClicked(1); }
		skin2Btn.innerText = "Skin 2";
		skinSelectElem.appendChild(skin2Btn);

		// Skin3
		const skin3Btn = document.createElement("button");
		skin3Btn.classList.add("btn-flat");
		skin3Btn.onclick = () => { this._onSkinClicked(2); }
		skin3Btn.innerText = "Skin 3";
		skinSelectElem.appendChild(skin3Btn);
	}

	private _createUECommandExample() {

		this._infoElem.innerHTML =
			`
		<p> <u>Example: Triggering Commands in Unreal Engine</u> </p>
		<ul>
			<li>Click on the resolution buttons to change your Unreal Engine application's resolution (requires a <code>-windowed</code> application).</li>
		</ul>
		<p>Under the hood these interactions use the WebRTC data channel to send command messages that we interpret on the UE side to call specific UE functions.</p>
		<p>There are a very select set of built-in commands such as <i>changing resolution</i> and <i>change encoder QP</i>, which can be triggered like so:</p>
		<code>pixelStreaming.emitCommand({"Encoder.MinQP": 51,})</code>

		<p>However, you can bind your own custom commands in C++ using:</p>
		<code>
			// C++ side 
			</br>
			IPixelStreamingInputHandler::SetCommandHandler(const FString& CommandName, const TFunction<void(FString, FString)>& Handler)
			</br>
			// JS side
			</br>
			pixelstreaming.emitCommand({"MyCustomCommand": "MyCustomCommandParameter"});
		</code>

		<p>Additionally you can also trigger Unreal Engine console commands like <code>stat gpu</code> if you launch Pixel Streaming with <code>-AllowPixelStreamingCommands</code> then calling:</p>
		<code>pixelstreaming.emitConsoleCommand(command: string)</code>
		`;

		// Add a new element for containing elements for res changing feature
		const changeResElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(changeResElem);

		// Make res change title
		const changeResTitle = document.createElement("h2");
		changeResTitle.innerText = "Send a custom command: ";
		changeResElem.appendChild(changeResTitle);

		// Make change resolution text
		const changeResText = document.createElement("p");
		changeResText.innerHTML = "Change resolution"
		changeResElem.appendChild(changeResText);

		// Make res change button container
		const changeResBtnContainer = document.createElement("div");
		changeResBtnContainer.classList.add("spaced-row");
		this._exampleSettingsElem.appendChild(changeResBtnContainer);

		// Make res change buttons

		// 720p
		const res720pBtn = document.createElement("button");
		res720pBtn.classList.add("btn-flat");
		res720pBtn.onclick = () => { this._onResClicked(1280, 720); }
		res720pBtn.innerText = "720p";
		changeResBtnContainer.appendChild(res720pBtn);

		// 1080p
		const res1080pBtn = document.createElement("button");
		res1080pBtn.classList.add("btn-flat");
		res1080pBtn.onclick = () => { this._onResClicked(1920, 1080); }
		res1080pBtn.innerText = "1080p";
		changeResBtnContainer.appendChild(res1080pBtn);

		// 1440p
		const res1440pBtn = document.createElement("button");
		res1440pBtn.classList.add("btn-flat");
		res1440pBtn.onclick = () => { this._onResClicked(2560, 1440); }
		res1440pBtn.innerText = "1440p";
		changeResBtnContainer.appendChild(res1440pBtn);

		// 4k
		const res4kBtn = document.createElement("button");
		res4kBtn.classList.add("btn-flat");
		res4kBtn.onclick = () => { this._onResClicked(3840, 2160); }
		res4kBtn.innerText = "4k";
		changeResBtnContainer.appendChild(res4kBtn);

		// Add a new element for containing elements for res changing feature
		const consoleCommandElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(consoleCommandElem);

		// Make console command title
		const consoleCommandTitle = document.createElement("h2");
		consoleCommandTitle.innerText = "Send a console command: ";
		consoleCommandElem.appendChild(consoleCommandTitle);

		// Text informing using about -AllowPixelStreamingCommands
		const informPSCommandsText = document.createElement("p");
		informPSCommandsText.innerHTML = "(Requires UE side launched with <code>-AllowPixelStreamingCommands</code>)"
		consoleCommandElem.appendChild(informPSCommandsText);

		// Make buttons for stat fps/stat gpu
		const consoleCmdBtnsContainer = document.createElement("div");
		consoleCmdBtnsContainer.classList.add("spaced-row");
		this._exampleSettingsElem.appendChild(consoleCmdBtnsContainer);

		// stat fps
		const statfpsBtn = document.createElement("button");
		statfpsBtn.classList.add("btn-flat");
		statfpsBtn.onclick = () => { this._pixelStreaming.emitConsoleCommand("stat fps"); }
		statfpsBtn.innerText = "stat fps";
		consoleCmdBtnsContainer.appendChild(statfpsBtn);

		// stat pixelstreaming
		const statgpuBtn = document.createElement("button");
		statgpuBtn.classList.add("btn-flat");
		statgpuBtn.onclick = () => { this._pixelStreaming.emitConsoleCommand("stat pixelstreaming"); }
		statgpuBtn.innerText = "stat pixelstreaming";
		consoleCmdBtnsContainer.appendChild(statgpuBtn);

	}

	private _createBVHCommandExample() {

		this._infoElem.innerHTML = "";

		// Add a new element for containing elements for res changing feature
		const changeResElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(changeResElem);

		// Send BVH Motion
		const changeResTitle = document.createElement("h2");
		changeResTitle.innerText = "Send BVH Motion: ";
		changeResElem.appendChild(changeResTitle);

		// Make file change title
		const changeResText = document.createElement("p");
		changeResText.innerHTML = "Select file"
		changeResElem.appendChild(changeResText);

		// Select the BVH file
		const bvhFileElem = document.createElement("div");
		bvhFileElem.classList.add("spaced-row");
		this._exampleSettingsElem.appendChild(bvhFileElem);

		// Make file selection buttons
		// Recording 0 3d
		const recording3DBtn = document.createElement("button");
		recording3DBtn.classList.add("btn-flat");
		recording3DBtn.onclick = () => { this._onSelectBVHFileClicked("./bvh/recording_0_3d.bvh"); }
		recording3DBtn.innerText = "Rec. 0 3d";
		bvhFileElem.appendChild(recording3DBtn);

		// Recording 0 6d
		const recording6DBtn = document.createElement("button");
		recording6DBtn.classList.add("btn-flat");
		recording6DBtn.onclick = () => { this._onSelectBVHFileClicked("./bvh/recording_0_6d.bvh"); }
		recording6DBtn.innerText = "Rec. 0 6d";
		bvhFileElem.appendChild(recording6DBtn);

		// User selected file
		const bhvFileBtn = document.createElement("input");
		bhvFileBtn.type = "file";
		bhvFileBtn.id = "bvh-file";
		bhvFileBtn.accept = ".bvh";
		bvhFileElem.appendChild(bhvFileBtn);

		const bhvFileLabel = document.createElement("label");
		bhvFileLabel.classList.add("btn-flat");
		bhvFileBtn.onchange = () => { this._onSelectBVHFileBtnClicked(); }
		bhvFileLabel.onclick = () => {
			if (bhvFileBtn.files?.length) {
				bhvFileBtn.value = '';
			}
			bhvFileBtn.click();
		}
		bhvFileLabel.innerText = "Select a file";
		bvhFileElem.appendChild(bhvFileLabel);

		// Text informing using about -AllowPixelStreamingCommands
		const selectedFilenameText = document.createElement("p");
		selectedFilenameText.id = "selected-bvh-filename";
		selectedFilenameText.innerHTML = "No file selected"
		changeResElem.appendChild(selectedFilenameText);

		// Add a new element for containing elements for res changing feature
		const consoleCommandElem = document.createElement("div");
		this._exampleSettingsElem.appendChild(consoleCommandElem);

		// Start/Stop motion text
		const changeStartStopText = document.createElement("h2");
		changeStartStopText.innerHTML = "Start/Stop Motion"
		consoleCommandElem.appendChild(changeStartStopText);

		// Make Motion control buttons

		// start motion
		const startMotionBtn = document.createElement("button");
		startMotionBtn.classList.add("btn-flat");
		startMotionBtn.disabled = false;
		startMotionBtn.id = "start-motion";
		startMotionBtn.onclick = () => { this._onStartMotionClicked(); }
		startMotionBtn.innerText = "Start Motion";
		consoleCommandElem.appendChild(startMotionBtn);

		// stop motion
		const stopMotionBtn = document.createElement("button");
		stopMotionBtn.classList.add("btn-flat");
		stopMotionBtn.disabled = true;
		stopMotionBtn.id = "stop-motion";
		stopMotionBtn.onclick = () => { this._onStopMotionClicked(); }
		stopMotionBtn.innerText = "Stop Motion";
		consoleCommandElem.appendChild(stopMotionBtn);

	}


	private _onSelectBVHFileClicked(filename: string) {
		fetch(filename)
			.then(response => response.blob())
			.then(blob => {
				const reader = new FileReader();
				reader.readAsText(blob);
				reader.onload = () => {
					var element = document.getElementById("bvh-file") as HTMLInputElement;
					let fileList: FileList | null = element.files;
					if (element.files?.length) {
						element.value = '';
					}

					const selectedFileText = document.getElementById('selected-bvh-filename');
					selectedFileText.innerHTML = "Remote file: " + filename.split('/').slice(-1);
					this._bvhFileLines = reader.result.toString().replace(/\r/g, '').split('\n');
				}
			}
			);
	}

	private _onSelectBVHFileBtnClicked() {
		var element = document.getElementById("bvh-file") as HTMLInputElement;
		let fileList: FileList | null = element.files;
		if (fileList) {
			var blob = new Blob([fileList[0]], { type: "application/octet-stream" });
			const reader = new FileReader();
			reader.readAsText(blob);
			reader.onload = () => {
				const selectedFileText = document.getElementById('selected-bvh-filename');
				selectedFileText.innerHTML = "Uploaded file: " + fileList[0]?.name;
				this._bvhFileLines = reader.result.toString().replace(/\r/g, '').split('\n');
			}
		}

	}
}


