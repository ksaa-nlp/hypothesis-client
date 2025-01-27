import { Icon, LabeledButton } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import { withServices } from '../../service-context';
import { applyTheme } from '../../helpers/theme';

import Menu from '../Menu';
import MenuItem from '../MenuItem';

/**
 * @typedef {import('../../../types/api').Group} Group
 * @typedef {import('../../../types/config').SidebarSettings} SidebarSettings
 */

/**
 * @typedef AnnotationPublishControlProps
 * @prop {Group} group - The group this annotation or draft would publish to
 * @prop {boolean} [isDisabled]
 *  - Should the save button be disabled? Hint: it will be if the annotation has no content
 * @prop {boolean} isPrivate - Annotation or draft is "Only Me"
 * @prop {() => void} onCancel - Callback for cancel button click
 * @prop {() => void} onSave - Callback for save button click
 * @prop {(isPrivate: boolean) => void} onSetPrivate - Callback for save button click
 * @prop {SidebarSettings} settings - Injected service
 */

/**
 * Render a compound control button for publishing (saving) an annotation:
 * - Save the annotation — left side of button
 * - Choose sharing/privacy option - drop-down menu on right side of button
 *
 * @param {AnnotationPublishControlProps} props
 */
function AnnotationPublishControl({
  group,
  isDisabled,
  isPrivate,
  onCancel,
  onSave,
  onSetPrivate,
  settings,
}) {
  const buttonStyle = applyTheme(
    ['ctaTextColor', 'ctaBackgroundColor'],
    settings
  );

  const menuLabel = (
    <div
      className="w-9 h-9 flex items-center justify-center text-color-text-inverted"
      style={buttonStyle}
    >
      <Icon name="expand-menu" classes="w-4 h-4" />
    </div>
  );

  return (
    <div className="flex flex-row gap-x-3">
      <div className="flex relative">
        <LabeledButton
          classes={classnames(
            // Turn off right-side border radius to align with menu-open button
            'rounded-r-none'
          )}
          data-testid="publish-control-button"
          style={buttonStyle}
          onClick={onSave}
          disabled={isDisabled}
          size="large"
          variant="primary"
        >
          النشر في {isPrivate ? 'خاص بي' : group.name}
        </LabeledButton>
        {/* This wrapper div is necessary because of peculiarities with
             Safari: see https://github.com/hypothesis/client/issues/2302 */}
        <div
          className={classnames(
            // Round the right side of this menu-open button only
            'flex flex-row rounded-r-sm bg-grey-7 hover:bg-grey-8'
          )}
          style={buttonStyle}
        >
          <Menu
            arrowClass={classnames(
              // Position up-pointing menu caret aligned beneath the
              // down-pointing menu-open button icon
              'right-[10px]'
            )}
            containerPositioned={false}
            contentClass={classnames(
              // Ensure the menu is wide enough to "reach" the right-aligned
              // up-pointing menu arrow
              'min-w-full'
            )}
            label={menuLabel}
            menuIndicator={false}
            title="Change annotation sharing setting"
            align="left"
          >
            <MenuItem
              icon={group.type === 'open' ? 'public' : 'groups'}
              label={group.name}
              isSelected={!isPrivate}
              onClick={() => onSetPrivate(false)}
            />
            <MenuItem
              icon="lock"
              label="Only Me"
              isSelected={isPrivate}
              onClick={() => onSetPrivate(true)}
            />
          </Menu>
        </div>
      </div>
      <div>
        <LabeledButton
          classes="p-2.5"
          icon="cancel"
          onClick={onCancel}
          size="large"
        >
          الغاء
        </LabeledButton>
      </div>
    </div>
  );
}

export default withServices(AnnotationPublishControl, ['settings']);
