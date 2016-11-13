import React, { Component } from 'react';

import Icon from '../components/Icon';

/**
 * Editor block to preview and edit images.
 */
class ImageBlock extends Component {
    constructor(props) {
        super(props);

        const { altText, alignment } = props.entity.getData();

        this.state = {
            altText: altText || '',
            alignment: alignment || 'left',
        };

        this.changeText = this.changeText.bind(this);
        this.changeAlignment = this.changeAlignment.bind(this);
        this.onSave = this.onSave.bind(this);
        this.renderMediaOptions = this.renderMediaOptions.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const { altText, alignment } = nextProps.entity.getData();

        // Reset unsaved changes.
        this.setState({
            altText: altText || '',
            alignment: alignment || 'left',
        });
    }

    changeText(e) {
        this.setState({
            altText: e.currentTarget.value,
        });
    }

    changeAlignment(e) {
        this.setState({
            alignment: e.currentTarget.value,
        });
    }

    onSave() {
        const { onSave } = this.props;
        const { alignment, altText } = this.state;

        onSave({
            alignment,
            altText,
        });
    }

    renderMediaOptions() {
        const { options, onCancel } = this.props;
        const { alignment, altText } = this.state;

        // TODO Add <label> elt for Alt text field.
        return (
            <div className="RichEditor-media-options">
                <div className="RichEditor-grid">
                    <div className="RichEditor-col">
                        <label className="u-block">
                            <h4>Alt text</h4>
                            <p>
                                <input
                                    type="text"
                                    value={altText}
                                    onChange={this.changeText}
                                />
                            </p>
                        </label>
                    </div>
                    <div className="RichEditor-col">
                        <h4>Image alignment</h4>
                        <p>
                            {options.imageFormats.map((format) => {
                                return (
                                    <label key={format.value}>
                                        <input
                                            type="radio"
                                            name="image-opts"
                                            value={format.value}
                                            onChange={this.changeAlignment}
                                            checked={format.value === alignment}
                                        />
                                        {format.label}
                                    </label>
                                );
                            })}
                        </p>
                    </div>
                </div>
                <p>
                    <button type="button" className="button button-secondary" onClick={this.onSave}>
                        Save changes
                    </button>
                    <button type="button" className="button button-secondary no" onClick={onCancel}>
                        Cancel
                    </button>
                </p>
            </div>
        );
    }

    render() {
        const { entity, active, onClick } = this.props;
        const { src, alt } = entity.getData();

        return (
            <div>
                <Icon name="image" />

                <div onClick={onClick} className="RichEditor-media-container">
                    <span className="RichEditor-media-preview">
                        <img src={src} alt={alt || ''} />
                    </span>
                </div>

                {active ? this.renderMediaOptions() : null}
            </div>
        );
    }
}

ImageBlock.propTypes = {
    options: React.PropTypes.object.isRequired,
    entity: React.PropTypes.object.isRequired,
    active: React.PropTypes.bool.isRequired,
    onClick: React.PropTypes.func.isRequired,
    onSave: React.PropTypes.func.isRequired,
    onCancel: React.PropTypes.func.isRequired,
};

export default ImageBlock;