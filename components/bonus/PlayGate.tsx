"use client";

import { useState } from "react";
import Link from "next/link";
import { GolfGame } from "./GolfGame";

export function PlayGate() {
  const [playing, setPlaying] = useState(false);
  const [won, setWon] = useState(false);

  function handleWin() {
    sessionStorage.setItem("game-unlocked", "true");
    // Give the ball's sink animation a moment to play before swapping
    // the game out for the "Continue" view.
    setTimeout(() => setWon(true), 900);
  }

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h2 className="text-h3">There's one more chapter.</h2>
      <p className="text-p1 text-foreground-secondary mt-2">
        You have to earn it.
      </p>
      {!playing && !won && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="mt-6 rounded-lg bg-accent text-accent-foreground px-6 py-3 text-p1"
        >
          Play
        </button>
      )}
      {playing && !won && <GolfGame onWin={handleWin} />}
      {won && (
        <div className="mt-6">
          <p className="text-p1 text-accent">Nice shot.</p>
          <Link
            href="/full-access/"
            className="inline-block mt-4 rounded-lg bg-accent text-accent-foreground px-6 py-3 text-p1"
          >
            Continue to Full Access
          </Link>
        </div>
      )}
    </section>
  );
}
