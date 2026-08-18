import React, { useState } from "react";
import "./SamIntro.css";

export default function SamIntro() {
  const [faceRevealed, setFaceRevealed] = useState(false);

  return (
    <main className="sam-page">

      {/* =====================================================
          HERO / INTRO
      ===================================================== */}

      <section className="sam-hero">

        <div className="sam-small-text">
          
        </div>

        <h1 className="sam-title">
          OH, SO YOU
          <br />
          WANT TO KNOW
          <br />
          <span>ABOUT ME?</span>
        </h1>

        {/* REAL CUTOUT + FACE REVEAL */}
        <button
          className="sam-cutout-reveal"
          type="button"
          onClick={() => setFaceRevealed(true)}
          aria-label="so this is me. click on the picture, trust me it's worth it"
        >
          <img
            src="/images/intro-pic.png"
            alt="Sam cutout"
          />

          <span>
            {faceRevealed ? "oh. you actually clicked. jk, this is me" : "so this is me. click on the picture, trust me it's worth it"}
          </span>

          {faceRevealed && (
            <img
              className="revealed-face"
              src="/images/face-reveal.png"
              alt="Sam face reveal"
            />
          )}
        </button>

        <div className="sam-note sam-note-one">
          okay fine.
        </div>

      </section>


      {/* =====================================================
          INTRODUCTION
      ===================================================== */}

      <section className="sam-intro">

        <div className="sam-section-label">
          01 — THE LORE
        </div>

        <div className="sam-intro-content">

          <h2>
            Unfortunately,
            <br />
            <em>I'm Sam.</em>
          </h2>

          <p className="sam-lead">
            Wait, how did my aesthetically professional page
            become this goofy all of a sudden?
          </p>
          <br></br>

          <p className="sam-lore-opening">
            Well, hi. I'm Sam and I'm weird like that.
          </p>

          <div className="sam-cutout sam-cutout-two">
            <img
              src="/images/intromeme.png"
              alt="Lore cutout"
            />
          </div>

          <p className="sam-lore-body">
            My mood fluctuations are pretty evident atp. I’m like that as a person, with no stability and sanity. I try to be sane by curating my zillion thoughts from my insane head and so happened the birth of this page. Okay, before I begin with my briefly boring self introduction, let's just get the questionable traits out of the way first.
          </p>

        </div>

      </section>


      {/* =====================================================
          PERSONALITY TOUR
      ===================================================== */}

      <section className="sam-personality">

        <div className="sam-section-label">
          02 — BRUTALLY EXPOSING MYSELF
        </div>

        <h1 className="personality-heading">
          SO APPARENTLY, I
          <br />
          OWN SOME
          <br />
          <em>QUESTIONABLE TRAITS.</em>
        </h1>

        <div className="sam-photo-grid">

          <div className="sam-photo photo-one">
            <img src="/images/photo1.png" alt="Personality tour photo 1" />
          </div>

          <div className="sam-photo photo-two">
            <img src="/images/photo2.png" alt="Personality tour photo 2" />
          </div>

          <div className="sam-photo photo-three">
            <img src="/images/photo3.png" alt="Personality tour photo 3" />
          </div>

        </div>

        <div className="personality-content">
          <article>
            <h3>The “Wait, what is that?” probelm</h3>
            <p>
              If I hear about something I've never heard of before, I can't just leave it alone. 
              I have to look it up. Then I find something else. Then another thing. And somehow I've spent an hour researching something I wasn't even supposed to care about.
            </p>
          </article>

          <article>
            <h3>The last minute-student special</h3>
            <p>
              I can have an exam coming up for weeks and still somehow convince myself that there's plenty of time. 
              Then suddenly it's the night before and I'm fighting for my life with three chapters, a coffee and absolutely no dignity (I defnitely am a morning person).
            </p>
          </article>

          <article>
            <h3>The chronically late incident</h3>
            <p>
              I'm late. A lot.
Sometimes I genuinely try to be on time and still somehow end up rushing out of the house like I'm escaping a crime scene from Brooklyn Nine Nine.
Gosh, I love Jake Peralta.
            </p>
          </article>

          <article>
            <h3>Me and basic coordination</h3>
            <p>
              Clumsy doesn't quite cover it. I can trip over absolutely
              nothing, walk into things that have been sitting there for years,
              and somehow make every entrance look accidental.
            </p>
          </article>
          <article>
            <h3>The things I should probably not say out loud</h3>

            <div className="personality-note-image">
              <img src="/images/puffball.png" alt="Puffball personality cutout" />
            </div>

            <p>
              I have a terrible habit of saying the weirdest thing that comes into my head. Sometimes it's funny. 
              Sometimes everyone goes completely silent and I immediately realise I should've just kept my mouth shut.
            </p>

            <p className="sam-side-note">
              pal, you just got the
              <br />
              personality tour.
            </p>
          </article>
        </div>

      </section>


      {/* =====================================================
          ACTUAL INTRODUCTION
      ===================================================== */}

      <section className="sam-story">

        <div className="sam-section-label">
          03 — THE ACTUAL INTRODUCTION
        </div>

        <div className="sam-story-heading">

          <span>SO YEAH.</span>

          <h2>
            THE ESSAYS
            <br />
            WE STRUGGLED
            <br />
            TO WRITE AS
            <br />
            <em>KIDS.</em>
          </h2>

        </div>

        <div className="sam-story-text">

          <p>
            I'm still struggling by the way.
          </p>

          <p>
            I'm Samyuktha, a kid still battling to grow up.
            I'm pursuing Information Technology and I hate
            to admit that I'm currently in my third year.
          </p>

          <p>
            So when I say this, the first word that popped
            up was "placements", right?
          </p>

          <p className="sam-big-aside">
            GOTCHA.
          </p>

          <p>
            Yeah it’s pretty hectic but since I love side questing, I asked myself “why not?”. Probably, it has to be that one socially approved excuse for whiling away my college responsibilities. 

          </p>

        </div>

        <div className="sam-cutout sam-cutout-three">
          <div className="cutout-placeholder">
            <img
            src="/images/meme1.png"
            alt="Intro cutout"
          />
          </div>
        </div>

      </section>


      {/* =====================================================
          SIDE QUESTS
      ===================================================== */}

      <section className="sam-sidequests">

        <div className="sam-section-label">
          04 — SIDE QUESTS
        </div>

        <h2>
          I GET BORED,
          <br />
          <em> OKAY.</em>
        </h2>

        <div className="sidequest-content">
          <p>
            I’ve been writing since a very long time. From publishing articles on my school magazine to creating this small space for myself, I’ve grown up somewhere in the middle. I’ve been drawn to writing so spontaneously and ever since I got into tech, I wanted to make the most of my two accidental passions and so, The Unfiltered Archives happened. Besides this, I try to make art and I’m a film enthusiast (at least I call my myself so) and I occasionally tinker on the keyboard too. 
          </p>

          <div className="sidequest-note-image">
            <img src="/images/quests.png" alt="A small side quest cutout" />
          </div>

          <div className="sam-note sam-note-three">
            before you think too much,
            <br />
            I also spend a surprising amount of time doing absolutely nothing.
          </div>
        </div>

      </section>


      {/* =====================================================
          INCONSISTENCY
      ===================================================== */}

      <section className="sam-chaos">

        <div className="sam-section-label">
          05 — A DISCLAIMER
        </div>

        <div className="chaos-left-image">
          <img src="/images/chaos-left.png" alt="An inconsistency cutout" />
        </div>

        <h2>
          I AM
          <br />
          EXTREMELY
          <br />
          <em>INCONSISTENT.</em>
        </h2>

        <p>
          If I had to be brutally honest, I’m not professionally trained to pursue these side quests nor am I consistent enough to do it everyday. I do it when I feel like it. If you ask me, I really stick to acting on impulse rather than forcing myself to do it. It kills the fascination and joy. But when I do, I go all in. So I’m extremely inconsistent and it doesn’t necessarily have to be negative.
        </p>
        <p>
          (I'm crying brb)
          <br></br>
          I do it when I feel like it.
        </p>

        <p className="sam-chaos-aside">
          Probably should’ve put more thought into naming this a blog but here we are. 
        </p>

        <p>
            I'm not proud okay.
        </p>
        

      </section>


      {/* =====================================================
          AI SECTION
      ===================================================== */}

      <section className="sam-ai">

        <div className="sam-section-label">
          06 — FOR THE RECORD
        </div>

        <h2>
          AI COULD
          <br />
          <em>NEVER.</em>
        </h2>

        <p>
          For the record, this is all me.
        </p>

        <div className="sam-cutout sam-cutout-four">
          <img
            src="/images/gng.png"
            alt="Overthinking cutout"
          />
        </div>

        <p>
          AI really wishes it had this level of overthinking. I try to keep my work authentic and as raw as possible without compromising on ethics. So if you spot any grammatical errors or unnecessary pauses, it’s just to prove that chat is not involved. Jokes apart but this is the whole point of this page. I jot down things, not forcefully but when I feel the urge to let things out of myself. 

        </p>

      </section>


      {/* =====================================================
          WHY TUA EXISTS
      ===================================================== */}

      <section className="sam-ending">

        <div className="sam-section-label">
          07 — WHY THIS EXISTS
        </div>

        <h2>
          I BLAME
          <br />
          <em>MY NOTES APP.</em>
        </h2>

                <div className="sam-ending-text">
          <div className="ending-right-image">
            <img
              src="/images/stillhere.png"
              alt="Why this exists cutout"
            />
          </div>
          <p>
            I've been doing this for a while now and looking
            at my messy Notes app one day, I thought it'd be
            nice to have a little dedicated space curated
            for me and my nonsense.
          </p>
          <p>
            I mostly write unhinged rambles but sometimes
            I surprise even myself with personal deep ones.
          </p>
        </div>

      </section>


      {/* =====================================================
          END
      ===================================================== */}

      <section className="sam-final">

        <div className="sam-final-small">
          I'M DONE I'M DONE
        </div>
        <br></br>
        <div className="sam-final-small">
           So you’ve made it through the boring introduction.
        </div>

        <h2>
          YOU DO
          <br />
          MATCH MY
          <br />
          <em>FREAK, DAWG.</em>
        </h2>

        <div className="final-heading-image">
          <img
            src="/images/thankyou.png"
            alt="Final section cutout"
          />
        </div>

        <p>
          Go ahead and hit a follow,
          only if you genuinely liked my stuff.
        </p>

        <div className="sam-thanks">
          Merci beaucoup.
          <br />
          <span>(with my best fake French accent ever)</span>
        </div>


      </section>

    </main>
  );
}