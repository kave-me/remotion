import React, {
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useState,
} from 'react';
import type {TCompMetadata} from 'remotion';
import {getDefaultOutLocation} from '../../../get-default-out-name';
import {Button} from '../../../preview-server/error-overlay/remotion-overlay/Button';
import type {AddRenderRequest} from '../../../preview-server/render-queue/job';
import {ModalsContext} from '../../state/modals';
import {Spacing} from '../layout';
import {ModalContainer} from '../ModalContainer';
import {NewCompHeader} from '../ModalHeader';
import {RemotionInput} from '../NewComposition/RemInput';
import {leftSidebarTabs} from '../SidebarContent';

type State =
	| {
			type: 'idle';
	  }
	| {
			type: 'success';
	  }
	| {
			type: 'load';
	  }
	| {
			type: 'error';
	  };

const initialState: State = {type: 'idle'};

type Action =
	| {
			type: 'start';
	  }
	| {
			type: 'succeed';
	  }
	| {
			type: 'fail';
	  };

const reducer = (state: State, action: Action): State => {
	if (action.type === 'start') {
		return {
			type: 'load',
		};
	}

	if (action.type === 'fail') {
		return {
			type: 'error',
		};
	}

	if (action.type === 'succeed') {
		return {
			type: 'success',
		};
	}

	return state;
};

const container: React.CSSProperties = {
	padding: 20,
};

const row: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
};

const label: React.CSSProperties = {
	width: 300,
	fontSize: 14,
};

const spacer: React.CSSProperties = {
	height: 6,
};

export const RenderModal: React.FC<{composition: TCompMetadata}> = ({
	composition,
}) => {
	const {setSelectedModal} = useContext(ModalsContext);

	const onQuit = useCallback(() => {
		setSelectedModal(null);
	}, [setSelectedModal]);

	const isMounted = useRef(true);

	const [state, dispatch] = useReducer(reducer, initialState);

	const [outName, setOutName] = useState(() =>
		getDefaultOutLocation({
			compositionName: composition.id,
			// TODO: Set default extension
			defaultExtension: 'png',
		})
	);

	const dispatchIfMounted: typeof dispatch = useCallback((payload) => {
		if (isMounted.current === false) return;
		dispatch(payload);
	}, []);

	const onValueChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
		(e) => {
			setOutName(e.target.value);
		},
		[]
	);

	const onClick = useCallback(() => {
		const body: AddRenderRequest = {
			compositionId: composition.id,
			type: 'still',
			outName,
		};
		leftSidebarTabs.current?.selectRendersPanel();
		fetch(`/api/render`, {
			method: 'post',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify(body),
		})
			.then((res) => res.json())
			.then((data: {success: boolean}) => {
				if (data.success) {
					dispatchIfMounted({type: 'succeed'});
					setSelectedModal(null);
				} else {
					dispatchIfMounted({type: 'fail'});
				}
			})
			.catch(() => {
				dispatchIfMounted({type: 'fail'});
			});
	}, [composition.id, dispatchIfMounted, outName, setSelectedModal]);

	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	return (
		<ModalContainer onOutsideClick={onQuit} onEscape={onQuit}>
			<NewCompHeader title={`Render ${composition.id}`} />
			<div style={container}>
				<div style={row}>
					<div style={label}>hi</div>
					<RemotionInput type="text" value={outName} onChange={onValueChange} />
				</div>
				<div style={spacer} />
				<div style={row}>
					<div style={label}>hi</div>
					<RemotionInput type="text" value={outName} onChange={onValueChange} />
				</div>
				<Spacing block y={0.5} />
				<div>
					<Button onClick={onClick} disabled={state.type === 'load'}>
						{state.type === 'idle' ? 'Render' : 'Rendering...'}
					</Button>
				</div>
			</div>
		</ModalContainer>
	);
};
