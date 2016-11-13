import { CompositeDecorator, convertToRaw } from 'draft-js';
import conversion from '../api/conversion';

const emptyDecorator = new CompositeDecorator([]);

const stubs = {
    emptyContent: JSON.stringify({}),
    realContent: JSON.stringify({
        entityMap: {},
        blocks: [
            {
                key: '1dcqo',
                text: 'Hello, World!',
                type: 'unstyled',
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {},
            },
            {
                key: 'dmtba',
                text: 'This is a title',
                type: 'header-two',
                depth: 0,
                inlineStyleRanges: [],
                entityRanges: [],
                data: {},
            },
        ],
    }),
};

describe('conversion', () => {
    describe('#createEditorState', () => {
        it('exists', () => {
            expect(conversion.createEditorState).toBeDefined();
        });

        it('creates empty state from empty content', () => {
            const state = conversion.createEditorState(stubs.emptyContent, emptyDecorator);
            const result = convertToRaw(state.getCurrentContent());
            expect(result.blocks.length).toEqual(1);
            expect(result.blocks[0].text).toEqual('');
        });

        it('creates state from real content', () => {
            const state = conversion.createEditorState(stubs.realContent, emptyDecorator);
            const result = convertToRaw(state.getCurrentContent());
            expect(result.blocks.length).toEqual(2);
            expect(result.blocks[0].text).toEqual('Hello, World!');
        });
    });

    describe('#serialiseEditorState', () => {
        it('exists', () => {
            expect(conversion.serialiseEditorState).toBeDefined();
        });

        it('discards empty content', () => {
            const state = conversion.createEditorState(stubs.emptyContent, emptyDecorator);
            expect(conversion.serialiseEditorState(state)).toEqual(stubs.emptyContent);
        });

        it('keeps real content', () => {
            const state = conversion.createEditorState(stubs.realContent, emptyDecorator);
            expect(conversion.serialiseEditorState(state)).toEqual(stubs.realContent);
        });
    });
});