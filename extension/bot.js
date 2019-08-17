'use strict';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const [ head ] = document.getElementsByTagName('head');
const s = document.createElement('style');
s.setAttribute('type', 'text/css');
s.appendChild(document.createTextNode(`
	.emote-item:hover .removeme { visibility: visible; }
	.removeme { visibility: hidden; }
	.menuitem { height: 40px; padding: 12px 16px; }
	.menuitem:hover { color: #fff; background-color: #3a3c3f; }`));
head.appendChild(s);

const request = data => new Promise((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', 'https://graphigo.prd.dlive.tv/', true);
	xhr.setRequestHeader(
		'authorization',
		JSON.parse(window.localStorage.getItem('store')).accessToken.token
	);
	xhr.onload = () => resolve(JSON.parse(xhr.responseText).data);
	xhr.onerror = error => reject(error);
	xhr.send(data);
});

const getDisplayName = () => {
	const matches = window.location.pathname.match(/\/([a-zA-Z0-9-_]+)/);
	if (matches.length > 1) {
		const [ , displayName ] = matches;
		if (displayName in [ 's', 'c' ]) {
			return undefined;
		}
		return displayName;
	}
	return undefined;
};

const addEmotes = async () => {
	let box;
	let i = 0;
	while (typeof box === 'undefined') {
		i++;
		[ box ] = document.getElementsByClassName('emote-tab-inner');
		await sleep(100);
		if (i === 5) break;
	}
	if (i !== 5) {
		for (let c = 0; c < box.childNodes.length; c++) {
			const child = box.childNodes[c];
			if (child.id) child.remove();
		}

		const stickers = JSON.parse(localStorage.getItem('stickers'));
		stickers.forEach(sticker => {
			if (!document.getElementById(sticker)) {
				if (sticker === stickers[0]) {
					const hr = document.createElement('hr');
					hr.style = 'border: #202020 solid 2px;';
					box.appendChild(hr);
				}
				const img = document.createElement('div');
				img.style = `width: 25%;height: 56px;padding: 4px;cursor: pointer;display: -webkit-box;
				display: -ms-flexbox;display: flex;-webkit-box-align: center;-ms-flex-align: center;
				align-items: center;-webkit-box-pack: center;-ms-flex-pack: center;justify-content: center;`;
				img.id = sticker;
				img.className = 'emote-item position-relative';
				img.setAttribute('data-v-41f53d46', '');
				img.innerHTML = `<img id="${sticker}" data-v-41f53d46=""
					src="https://images.prd.dlivecdn.com/emote/${sticker}" style="max-width: 100%; max-height: 100%;"/>
					<svg data-v-41f53d46="" class="position-absolute clickable delete-emote"
					style="width: 18px; height: 18px; right: -9px; top: -9px; z-index: 50;">
					<image id="delete-${sticker}" class="removeme"
					xlink:href="/img/delete-emote-darkmode.d4f5e96a.svg" width="18" height="18"></image></svg>`;
				box.appendChild(img);
			}
		});
	}
};

document.addEventListener('click', e => {
	if (e.target && e.target.className === 'emote-img margint-3 clickable') {
		Array.prototype.forEach.call(document.getElementsByClassName('menu-section'), menu => {
			const div = document.createElement('div');
			div.innerHTML = 'Add Xtra Sticker';
			div.style = '-webkit-box-pack: center;-ms-flex-pack: center;justify-content: center;}';
			div.className =
				'menuitem d-menu-item flex-align-center text-12-regular text-grey clickable text-nowrap';
			div.onclick = () => {
				let stickers = [];
				const image = div.parentNode.parentNode.parentNode.parentNode.parentNode.firstChild
					.firstChild.childNodes[1].firstChild.firstChild.firstChild.childNodes[1].src.split('/');
				const sticker = image[image.length - 1];
				if (localStorage.getItem('stickers') !== null) {
					stickers = JSON.parse(localStorage.getItem('stickers'));
				}
				if (!stickers.includes(sticker)) {
					stickers.push(sticker);
					localStorage.setItem('stickers', JSON.stringify(stickers));
				}
			};
			menu.childNodes[0].childNodes[0].insertBefore(div, menu.childNodes[0].childNodes[0].firstChild);
		});
	} else if (e.target && e.target.src === 'https://dlive.tv/img/smile-icon.4d0482c6.svg') {
		addEmotes();
	} else if (e.target && e.target.id) {
		let stickers = JSON.parse(localStorage.getItem('stickers'));
		if (stickers.includes(e.target.id)) {
			request('{"query":"mutation SendStreamChatMessage($input: SendStreamchatMessageInput!) ' +
				'{sendStreamchatMessage(input: $input) {err{code} message {... on ChatText {id}}}}","variables": ' +
				`{"input":{"streamer":"${JSON.parse(window.localStorage.getItem('names'))[getDisplayName()]}", ` +
				`"message":":emote/mine/dlive/${e.target.id}:", "roomRole": "Owner", "subscribing": true}}` +
				',"operationName":"SendStreamChatMessage"}"}');
		} else if (e.target.id.split('-')[0] === 'delete') {
			stickers = [];
			if (localStorage.getItem('stickers') !== null) {
				stickers = JSON.parse(localStorage.getItem('stickers'));
			}
			if (stickers.length) {
				const index = stickers.indexOf(e.target.id.split('-')[1]);
				if (index >= 0) stickers.splice(index, 1);
				localStorage.setItem('stickers', JSON.stringify(stickers));
				addEmotes();
			}
		}
	}
});

const getPageUsername = async () => {
	const displayName = getDisplayName();
	if (typeof displayName !== 'undefined') {
		let names = window.localStorage.getItem('names');
		if (names === null) {
			window.localStorage.setItem('names', '{}');
			names = '{}';
		}
		names = JSON.parse(names);
		if (!(displayName in names)) {
			let userName = null;
			while (userName === null) {
				await sleep(1000);
				request(`{
					"query":"query LivestreamPage()
					{
						userByDisplayName (displayname: '${displayName}')
						{
							username
						}
					}",
					"operationName":"LivestreamPage"
				}`).then(ls => {
					userName = ls.userByDisplayName.username;
				});
			}
			names[displayName] = userName;
			window.localStorage.setItem('names', JSON.stringify(names));
		}
	}
};

getPageUsername();

let oLoc = location.href;
setInterval(() => {
	if (location.href !== oLoc) {
		getPageUsername();
		oLoc = location.href;
	}
}, 1000);
