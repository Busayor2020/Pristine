import { en } from '@pristine/copy';
import { Button, LockIcon, TapIcon, UndoIcon } from '@pristine/ui';

export interface PermissionScreenProps {
  readonly onAccept: () => void;
  readonly onDecline: () => void;
}

/**
 * Shown immediately before Android's own permission dialog.
 *
 * Priming exists because the system dialog gives no room to explain anything,
 * and a denied permission is expensive to recover from. Saying what "yes"
 * actually means first is the difference between a considered yes and a
 * reflexive no.
 *
 * "Not now" is a real option, deliberately. A screen that only offers agreement
 * teaches users to distrust the next thing it says.
 */
export function PermissionScreen({ onAccept, onDecline }: PermissionScreenProps) {
  const points = [
    { icon: <TapIcon />, text: en['permission.point1'] },
    { icon: <LockIcon />, text: en['permission.point2'] },
    { icon: <UndoIcon />, text: en['permission.point3'] },
  ];

  return (
    <div className="pr-screen">
      <div className="pr-screen__scroll pr-screen__scroll--wide pr-screen__scroll--inset">
        {/* A gallery grid with one photo picked out, standing for the promise
            that only tapped photos are read. Decorative. */}
        <div className="pr-permission__art" aria-hidden="true">
          <span />
          <span className="pr-permission__art--picked" />
          <span />
          <span />
          <span />
          <span />
        </div>

        <h1 className="pr-display pr-display--small">{en['permission.title']}</h1>
        <p className="pr-lead pr-lead--tight">{en['permission.body']}</p>

        <ul className="pr-points">
          {points.map((point) => (
            <li className="pr-points__item" key={point.text}>
              <span className="pr-points__icon">{point.icon}</span>
              <span className="pr-points__text">{point.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pr-screen__footer pr-screen__footer--wide">
        <Button variant="primary" onClick={onAccept}>
          {en['permission.accept']}
        </Button>
        <Button variant="quiet" onClick={onDecline}>
          {en['permission.decline']}
        </Button>
      </div>
    </div>
  );
}
