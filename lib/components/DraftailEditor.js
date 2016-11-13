import React, { Component } from 'react';

import {
  Editor,
  EditorState,
  RichUtils,
  CompositeDecorator,
  Entity,
  SelectionState,
  DefaultDraftBlockRenderMap,
} from 'draft-js';

import { Map } from 'immutable';

import DraftUtils from '../utils/DraftUtils';

// =============================================================================
// Config
// =============================================================================

import config, { MAX_LIST_NESTING, STATE_SAVE_INTERVAL } from '../config';

// =============================================================================
// UI Components
// =============================================================================

import BlockControls from '../components/BlockControls';
import InlineStyleControls from '../components/InlineStyleControls';
import Button from '../components/Button';
import Portal from '../components/Portal';
import Tooltip from '../components/Tooltip';

import MediaBlock from '../blocks/MediaBlock';
import DividerBlock from '../blocks/DividerBlock';

// =============================================================================
// Utilities
// =============================================================================

import conversion from '../api/conversion';

const $ = global.jQuery;

const blockRenderMap = DefaultDraftBlockRenderMap.merge(Map({
    'horizontal-rule': {
        element: 'div',
    },
}));

/**
 * The top-level component for the Draft.js editor.
 */
class DraftailEditor extends Component {
    constructor(props) {
        super(props);
        const { options } = props;

        this.state = {
            editorState: conversion.createEditorState(props.value, new CompositeDecorator(options.decorators)),
        };

        let updateTimeout;
        this.onChange = (editorState) => this.setState({ editorState }, () => {
            if (updateTimeout) {
                global.clearTimeout(updateTimeout);
            }
            updateTimeout = global.setTimeout(this.saveRawState, STATE_SAVE_INTERVAL);
        });

        this.toggleBlockType = this.toggleBlockType.bind(this);
        this.toggleInlineStyle = this.toggleInlineStyle.bind(this);

        this.handleKeyCommand = this.handleKeyCommand.bind(this);
        this.handleTabCommand = this.handleTabCommand.bind(this);

        this.onEditEntity = this.onEditEntity.bind(this);
        this.onRemoveEntity = this.onRemoveEntity.bind(this);

        this.renderDialog = this.renderDialog.bind(this);
        this.renderTooltip = this.renderTooltip.bind(this);
        this.renderControls = this.renderControls.bind(this);

        this.onRequestDialog = this.onRequestDialog.bind(this);
        this.saveRawState = this.saveRawState.bind(this);
        this.setSelectionToCurrentEntity = this.setSelectionToCurrentEntity.bind(this);
        this.updateState = this.updateState.bind(this);
        this.onDialogComplete = this.onDialogComplete.bind(this);
        this.lockEditor = this.lockEditor.bind(this);
        this.unlockEditor = this.unlockEditor.bind(this);
        this.blockRenderer = this.blockRenderer.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.addModel = this.addModel.bind(this);
        this.addHR = this.addHR.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
    }

    componentDidMount() {
        document.body.addEventListener('click', this.handleFocus);
        document.body.addEventListener('focus', this.handleFocus);
    }

    componentWillUnmount() {
        document.body.removeEventListener('click', this.handleFocus);
        document.body.removeEventListener('focus', this.handleFocus);

        this.$tooltip = null;
    }

    handleFocus() {
      // if (this.wrapperRef.contains(e.target)) {
      //   this.setState({readOnly: false}, () => {
      //     global.setTimeout(() => {
      //       this.editorRef.focus();
      //     }, 0)
      //   })
      // } else {
      //   this.setState({readOnly: true});
      // }
    }

    saveRawState() {
        const { editorState } = this.state;

        this.inputElt.value = conversion.serialiseEditorState(editorState);
    }

    // Sets a selection to encompass the containing entity.
    setSelectionToCurrentEntity() {
        const { editorState } = this.state;
        const startKey = editorState.getSelection().getStartKey();
        const block = editorState.getCurrentContent().getBlockForKey(startKey);
        const selectionState = editorState.getSelection();
        const startOffset = selectionState.getAnchorOffset();
        const endOffset = selectionState.getFocusOffset();

        // let entity;
        let nextStart;
        let nextEnd;

        block.findEntityRanges((character) => {
            const entityKey = character.getEntity();
            return entityKey !== null;
        }, (entityStart, entityEnd) => {
            if (startOffset >= entityStart && endOffset <= entityEnd) {
                // const entityKey = block.getEntityAt(entityStart);

                // if (entityKey) {
                //     entity = Entity.get(entityKey);
                // }

                nextStart = entityStart;
                nextEnd = entityEnd;
            }
        });

        if (nextEnd) {
            const nextSelection = SelectionState.createEmpty(startKey);
            const updatedSelection = nextSelection.merge({
                anchorOffset: nextStart,
                focusKey: startKey,
                focusOffset: nextEnd,
            });
            const nextState = EditorState.acceptSelection(this.state.editorState, updatedSelection);
            this.onChange(nextState);

            global.setTimeout(() => this.editorRef.focus(), 0);
        }
    }

    updateState(state) {
        this.onChange(state);
      // not sure we need this.
      // setTimeout(() => this.editorRef.focus(), 0);
        return true;
    }

    handleTabCommand(event) {
        const { editorState } = this.state;
        const newState = RichUtils.onTab(event, editorState, MAX_LIST_NESTING);
        const isAtStart = newState.isSelectionAtStartOfContent();
        const isAtEnd = newState.isSelectionAtEndOfContent();

        if (isAtStart && event.shiftKey) {
            return;
        }

        if (isAtEnd) {
            return;
        }

        if (newState) {
            return this.updateState(newState);
        }
    }

    handleKeyCommand(command) {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);

        if (newState) {
            return this.updateState(newState);
        }

        return false;
    }

    toggleBlockType(blockType) {
        const { editorState } = this.state;
        this.onChange(RichUtils.toggleBlockType(editorState, blockType));
    }

    toggleInlineStyle(inlineStyle) {
        const { editorState } = this.state;
        this.onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }

    onEditEntity(entityKey) {
        const { options } = this.props;
        const entity = Entity.get(entityKey);
        const entityData = entity.getData();
        const { contentType } = entityData;

        this.setSelectionToCurrentEntity();

        const pickerOptions = options.modelPickerOptions.find(p => p.contentType === contentType);

        this.setState({
            activeEntityDialog: entity.type,
            entity,
            dialogOptions: {
                contentType,
                pickerOptions,
            },
        });
    }

    onRemoveEntity() {
        const { editorState } = this.state;
        const entitySelectionState = DraftUtils.getSelectedEntitySelection(editorState);

        this.setState({
            shouldShowTooltip: false,
        });

        this.onChange(RichUtils.toggleLink(editorState, entitySelectionState, null));
    }

    addHR() {
        const { editorState } = this.state;
        const entityKey = Entity.create('TOKEN', 'IMMUTABLE', {});
        const nextState = DraftUtils.insertBlock(editorState, entityKey, ' ', 'horizontal-rule');
        this.updateState(nextState);
    }

    addModel(entityName, contentType) {
        const { options } = this.props;
        const pickerOptions = options.modelPickerOptions.find(p => p.contentType === contentType);

        this.setState({
            activeBlockDialog: entityName,
            readOnly: true,
            dialogOptions: {
                contentType,
                pickerOptions,
            },
        });
    }

    blockRenderer(contentBlock) {
        const { options } = this.props;
        const type = contentBlock.getType();

        switch (type) {
        case 'atomic':
            return {
                component: MediaBlock,
                editable: false,
                props: {
                    options: options,
                    lockEditor: this.lockEditor,
                    unlockEditor: this.unlockEditor,
                    editorState: this.state.editorState,
                    onUpdate: this.onDialogComplete,
                },
            };

        case 'horizontal-rule':
            return {
                component: DividerBlock,
                editable: false,
                props: {},
            };

        default:
            return null;
        }
    }

    lockEditor() {
        this.setState({
            readOnly: true,
        });
    }

    unlockEditor() {
        this.setState({
            readOnly: false,
        });
    }

    onRequestDialog(entityName) {
        const { editorState } = this.state;
        const selection = editorState.getSelection();

        if (!selection.isCollapsed()) {
            const selectionState = editorState.getSelection();
            const selStart = selectionState.getStartOffset();
            const startKey = editorState.getSelection().getStartKey();
            const selectedBlock = editorState.getCurrentContent().getBlockForKey(startKey);

            let entity;
            const entityId = selectedBlock.getEntityAt(selStart);

            if (entityId) {
                entity = Entity.get(entityId);
            }

            this.setState({
                activeEntityDialog: entityName,
                entity: entityId ? entity : null,
            });
        }
    }

    onDialogComplete(nextState) {
        this.setState({
            activeEntityDialog: null,
            activeBlockDialog: null,
            dialogOptions: null,
        }, () => {
            if (nextState) {
                this.updateState(nextState);
            }

            global.setTimeout(() => {
                this.setState({ readOnly: false }, () => {
                    global.setTimeout(() => {
                        this.editorRef.focus();
                    }, 0);
                });
            }, 0);
        });
    }

    onMouseUp(e) {
        this.$tooltip = $(e.target).closest('[data-tooltip]');

        this.setState({
            shouldShowTooltip: this.$tooltip.length > 0,
        });
    }

    onKeyUp() {
        this.setState({
            shouldShowTooltip: false,
        });
    }

    renderDialog() {
        const { options } = this.props;
        const { activeEntityDialog, activeBlockDialog, entity, editorState, dialogOptions } = this.state;
        const activeDialogType = activeEntityDialog ? activeEntityDialog : activeBlockDialog;
        let dialog;
        let Klass;
        let props;

        if (activeDialogType) {
            dialog = options.sources.find(obj => obj.entity === activeDialogType);

            Klass = dialog.control;
            props = {
                onClose: this.onDialogComplete,
                onUpdate: this.onDialogComplete,
                entityType: activeDialogType,
                entity,
                editorState,
            };

            if (dialogOptions) {
                props = Object.assign({}, props, dialogOptions);
            }

            if (entity) {
                props.contentType = entity.getData().contentType;
            }

            return (
                <Klass {...props} />
            );
        }

        return null;
    }

    renderTooltip() {
        const { editorState, shouldShowTooltip } = this.state;
        let tooltip = null;

        if (shouldShowTooltip) {
            const entityKey = DraftUtils.getSelectionEntity(editorState);
            const entityData = DraftUtils.getEntityData(entityKey);

            tooltip = entityData ? (
                <Tooltip
                    onRemove={this.onRemoveEntity}
                    onEdit={this.onEditEntity.bind(this, entityKey)}
                    entityData={entityData}
                    position={{
                        left: this.$tooltip.offset().left,
                        top: this.$tooltip.offset().top + this.$tooltip.get(0).offsetHeight,
                    }}
                />
            ) : null;
        }

        return (
            <Portal id="tooltip-portal">
                {tooltip}
            </Portal>
        );
    }

    renderControls() {
        const { options } = this.props;
        const { editorState, readOnly } = this.state;

        const addMedia = (type) => {
            this.setState({
                activeBlockDialog: type,
                readOnly: true,
            });
        };

        return (
            <div className={`json-text__controls${readOnly ? ' json-text--readonly' : ''}`} role="toolbar">
                <BlockControls
                    styles={config.get('BLOCK_TYPES')}
                    editorState={editorState}
                    onToggle={this.toggleBlockType}
                />
                <InlineStyleControls
                    styles={config.get('INLINE_STYLES')}
                    editorState={editorState}
                    onToggle={this.toggleInlineStyle}
                />
                <Button
                    onClick={this.addHR}
                    label="HR"
                    icon="horizontalrule"
                    style="image"
                />

                {options.mediaControls.map((control) => (
                    <Button
                        key={control.entity}
                        onClick={this.onRequestDialog.bind(this, control.entity)}
                        label={control.label}
                        icon={control.icon}
                    />
                ))}

                {options.dialogControls.map((control) => (
                    <Button
                        key={control.entity}
                        onClick={this.onRequestDialog.bind(this, control.entity)}
                        label={control.label}
                        icon={control.icon}
                    />
                ))}

                {options.modelPickerOptions.map((picker) => (
                    <Button
                        key={picker.contentType}
                        onClick={this.addModel.bind(this, options.MODEL, picker.contentType)}
                        label={picker.label}
                        icon={picker.icon}
                        style="image"
                    />
                ))}
            </div>
      );
    }

    render() {
        const { name } = this.props;
        const { editorState, readOnly } = this.state;

        return (
            <div
                ref={(ref) => { this.wrapperRef = ref; }}
                className="json-text"
                onBlur={this.saveRawState}
                onClick={this.handleFocus}
                onMouseUp={this.onMouseUp}
                onKeyUp={this.onKeyUp}
            >
                {this.renderControls()}

                <Editor
                    ref={(ref) => { this.editorRef = ref; }}
                    editorState={editorState}
                    onChange={this.onChange}
                    readOnly={readOnly}
                    handleKeyCommand={this.handleKeyCommand}
                    onTab={this.handleTabCommand}
                    spellCheck={false}
                    blockRendererFn={this.blockRenderer}
                    blockRenderMap={blockRenderMap}
                />

                {this.renderTooltip()}

                {this.renderDialog()}

                <input
                    ref={(ref) => { this.inputElt = ref; }}
                    type="hidden"
                    name={name}
                />
            </div>
        );
    }
}

DraftailEditor.propTypes = {
    name: React.PropTypes.string.isRequired,
    value: React.PropTypes.string.isRequired,
    options: React.PropTypes.shape({
        modelPickerOptions: React.PropTypes.arrayOf(React.PropTypes.shape({
            label: React.PropTypes.string.isRequired,
            contentType: React.PropTypes.string.isRequired,
            fields: React.PropTypes.arrayOf(React.PropTypes.shape({
                label: React.PropTypes.string.isRequired,
                name: React.PropTypes.string.isRequired,
            })),
            display: React.PropTypes.string.isRequired,
        })).isRequired,
        imageFormats: React.PropTypes.arrayOf(React.PropTypes.shape({
            label: React.PropTypes.string.isRequired,
            value: React.PropTypes.string.isRequired,
        })).isRequired,
    }).isRequired,
};

export default DraftailEditor;