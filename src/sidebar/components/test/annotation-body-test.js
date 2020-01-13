import { mount } from 'enzyme';
import { createElement } from 'preact';

import AnnotationBody from '../annotation-body';
import { $imports } from '../annotation-body';

import mockImportedComponents from './mock-imported-components';

describe('AnnotationBody', () => {
  function createBody(props = {}) {
    return mount(<AnnotationBody text="test comment" {...props} />);
  }

  beforeEach(() => {
    $imports.$mock(mockImportedComponents());
  });

  afterEach(() => {
    $imports.$restore();
  });

  it('displays the body if `isEditing` is false', () => {
    const wrapper = createBody({ isEditing: false });
    assert.isFalse(wrapper.exists('MarkdownEditor'));
    assert.isTrue(wrapper.exists('MarkdownView'));
  });

  it('displays an editor if `isEditing` is true', () => {
    const wrapper = createBody({ isEditing: true });
    assert.isTrue(wrapper.exists('MarkdownEditor'));
    assert.isFalse(wrapper.exists('MarkdownView'));
  });
});
