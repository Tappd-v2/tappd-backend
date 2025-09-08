// Simple WebSocket manager used to subscribe/unsubscribe sockets to topics and publish messages
const topics = new Map<string, Set<any>>();

export function subscribe(topic: string, ws: any) {
	let set = topics.get(topic);
	if (!set) {
		set = new Set();
		topics.set(topic, set);
	}
	set.add(ws);
}

export function unsubscribe(topic: string, ws: any) {
	const set = topics.get(topic);
	if (!set) return;
	set.delete(ws);
	if (set.size === 0) topics.delete(topic);
}

export function unsubscribeAll(ws: any) {
	for (const [topic, set] of topics) {
		if (set.has(ws)) {
			set.delete(ws);
			if (set.size === 0) topics.delete(topic);
		}
	}
}

export function publish(topic: string, data: any) {
	const set = topics.get(topic);
	if (!set) return;
	const message = typeof data === 'string' ? data : JSON.stringify(data);
	for (const ws of Array.from(set)) {
		try {
			// attempt common send signatures
			if (typeof ws.send === 'function') {
				ws.send(message);
			} else if (ws.raw && typeof ws.raw.send === 'function') {
				ws.raw.send(message);
			} else if (typeof ws.publish === 'function') {
				ws.publish(topic, message);
			} else {
				// last resort
				(ws as any).send?.(message);
			}
		} catch (err) {
			console.error('Failed to send ws message', err);
			set.delete(ws);
		}
	}
}
