import { Icon, Link } from '@hypothesis/frontend-shared';
import classnames from 'classnames';

import { isThirdPartyService } from '../helpers/is-third-party-service';
import { withServices } from '../service-context';

/**
 * Subcomponent: an "instruction" within the tutorial step that includes an
 * icon and a "command" associated with that icon. Encapsulating these together
 * allows for styling to keep them from having a line break between them.
 *
 * @param {object} props
 *   @param {string} props.commandName - Name of the "command" the instruction represents
 *   @param {string} props.iconName - Name of the icon to display
 */
function TutorialInstruction({ commandName, iconName }) {
  return (
    <span className="whitespace-nowrap">
      <Icon
        name={iconName}
        classes={classnames(
          'mx-1 -mt-1', // Give horizontal space; pull up top margin a little
          'text-color-text-light inline'
        )}
      />
      <em>{commandName}</em>
    </span>
  );
}

/**
 * Tutorial for using the sidebar app
 *
 * @param {object} props
 *   @param {import('../../types/config').SidebarSettings} props.settings
 */
function Tutorial({ settings }) {
  const canCreatePrivateGroups = !isThirdPartyService(settings);
  return (
    <ol className="list-decimal pl-10 space-y-2">
      <li>
       لتوسيم الكلمة ، حدد النص ثم اختر زر{' '}
        <TutorialInstruction iconName="annotate" commandName="توسيم" />{' '}
        .
      </li>
      <li>
        لتظليل الكلمة (
        <Link
          classes="underline hover:underline"
          href="https://web.hypothes.is/help/why-are-highlights-private-by-default/"
          target="_blank"
        >
          ظاهرة لك فقط
        </Link>
        ), حدد النص ثم اختر{' '}
        <TutorialInstruction iconName="highlight" commandName="تظليل" />{' '}
        .
      </li>
      {canCreatePrivateGroups && (
        <li>
         للتوسيم في مجموعة خاصة، اختر المجموعة من القائمة اعلاه. في حال لم تظهر المجموعة اسأل منشئ المجموعة{' '}
          <Link
            classes="underline hover:underline"
            href="https://web.hypothes.is/help/how-to-join-a-private-group/"
            target="_blank"
          >
            رابط الانضمام
          </Link>
          ).
        </li>
      )}
      <li>
        للرد على كلمة موسمة، اختر {' '}
        <TutorialInstruction iconName="reply" commandName="الرد" /> .
      </li>
    </ol>
  );
}

export default withServices(Tutorial, ['settings']);
