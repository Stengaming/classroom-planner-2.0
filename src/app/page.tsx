"use client";

import styles from './page.module.css'
import { useState } from 'react';
import SeatsGrid from './SeatsGrid';
import { type Constraint, DistanceConstraintData, RowConstraintData, rowConstraintFrom, distanceConstraintFrom } from './Constraint';
import { type InputSeat, generatePlan, Row, Column, Seat, SeatObject, PupilObject } from './algo';
import { PupilCard } from './PupilCard';
import { Dictionary, range } from 'lodash';
import { ConstraintsEditor } from './ConstraintsEditor';
import { LuClipboardCopy } from 'react-icons/lu';
import { FaMagic } from 'react-icons/fa';

const ROWS = 4;
const COLUMNS = 10;

export default function Home() {

  const [rows, setRows] = useState(ROWS);
  const [columns, setColumns] = useState(COLUMNS);

  const [selectedSeats, setSelectedSeats] = useState<Set<Seat>>(new Set());
  const [rowConstraints, setRowConstraints] = useState<RowConstraintData[]>([]);
  const [distanceConstraints, setDistanceConstraints] = useState<DistanceConstraintData[]>([]);

  const [pupils, setPupils] = useState<string[]>([]);
  const [newPupils, setNewPupils] = useState<string>("");

  const [generatedPlanSeats, setGeneratedPlanSeats] = useState<Dictionary<SeatObject> | undefined>(undefined);
  const [generatedPlanPupils, setGeneratedPlanPupils] = useState<Dictionary<PupilObject> | undefined>(undefined);

  const handleClick = (row: Row, column: Column) => {
    if (selectedSeats.has(`R${row}C${column}`)) {
      selectedSeats.delete(`R${row}C${column}`);
      setSelectedSeats(new Set(selectedSeats));
    } else {
      setSelectedSeats(new Set(selectedSeats).add(`R${row}C${column}`));
    }
  } 

  const handleGenerate = () => {
    const seats = Array.from(selectedSeats).map(seat => {
      const g = seat.match(/^R(\d+)C(\d+)$/)!;
      return [parseInt(g[1]), parseInt(g[2])] satisfies InputSeat;
    });

    const constraints: Constraint[] = [
      ...rowConstraints.map(({pupil, position}) => rowConstraintFrom(pupil, position)),
      ...distanceConstraints.map(({pupil1, pupil2}) => distanceConstraintFrom(pupil1, pupil2))
    ];

    const [planPupils, planSeats] = generatePlan(pupils, seats, constraints);

    setGeneratedPlanSeats(planSeats);
    setGeneratedPlanPupils(planPupils);
  }

  const handleAddRow = () => {
    setRows(rows + 1);
  }

  const handleRemoveRow = () => {
    const filteredSet = Array.from(selectedSeats).filter(seat => {
      const g = seat.match(/^R(\d+)C(\d+)$/)!;
      return parseInt(g[1]) < rows;
    });
    setSelectedSeats(new Set(filteredSet));
    setRows(rows - 1);
  }

  const handleAddColumn = () => {
    setColumns(columns + 1);
  }

  const handleRemoveColumn = () => {
    const filteredSet = Array.from(selectedSeats).filter(seat => {
      const g = seat.match(/^R(\d+)C(\d+)$/)!;
      return parseInt(g[2]) < columns;
    });
    setSelectedSeats(new Set(filteredSet));
    setColumns(columns - 1);
  }

  const handleAddRowConstraint = (pupil: string, row: Row) => {
    const existingConstraint = rowConstraints.find(c => c.pupil === pupil);

    if (existingConstraint) {
      setRowConstraints(rowConstraints.map(c => {
        if (c.pupil === pupil) {
          return { ...c, position: row };
        }
        return c;
      }));
    } else {
      setRowConstraints([...rowConstraints, { pupil, position: row }]);
    }
  }

  const handleRemoveRowConstraint = (pupil: string) => {
    setRowConstraints(rowConstraints.filter(c => c.pupil !== pupil));
  }

  const handleAddDistanceConstraint = (pupil: string, otherPupil: string) => {
    const existingConstraint = distanceConstraints.find(c => 
      (c.pupil1 === pupil && c.pupil2 === otherPupil) || (c.pupil1 === otherPupil && c.pupil2 === pupil)  
    );

    if (!existingConstraint) {
      setDistanceConstraints([...distanceConstraints, { pupil1: pupil, pupil2: otherPupil }]);
    }
  }

  const handleRemoveDistanceConstraint = (pupil: string, otherPupil: string) => {
    setDistanceConstraints(distanceConstraints.filter(c => 
      !(c.pupil1 === pupil && c.pupil2 === otherPupil) && !(c.pupil1 === otherPupil && c.pupil2 === pupil)  
    ));
  }

  const handleExportPupils = () => {
    const pupilsString = pupils.join(",");
    navigator.clipboard.writeText(pupilsString);
    alert(`✅ users copied to clipboard`);
  }

  const parsedPupils = newPupils.split(",").map(p => p.trim()).filter(p => p !== "");
  const availableRows = range(1, rows + 1).filter(row => {
    const rowString = `R${row}`;
    return Array.from(selectedSeats).some(seat => seat.startsWith(rowString));
  });

  const canGeneratePlan: boolean = pupils.length <= selectedSeats.size && pupils.length > 1 && selectedSeats.size > 1;

  console.log("Pupils", generatedPlanPupils);

  return (
    <main className={styles.main}>
      <section className={styles.left}>
        <div className={styles.header}>
          <h1>classroom planner</h1>
          <p>Generate a seating plan for your favorite classroom.</p>
        </div>
        <div className={styles.pupils}>
          <h2>Import your students</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (newPupils.trim() === "") return;
              setPupils([...pupils, ...parsedPupils]);
              setNewPupils("");
            }}
            className={styles.newPupilForm}
          >
            <label htmlFor="pupil" hidden>Import students</label>
            <input id="pupil" value={newPupils} onChange={e => setNewPupils(e.target.value)} type="text" placeholder="vul de naam in van een student"/>
            <input value="Import" type="submit" className={styles.action} disabled={parsedPupils.length === 0}/>

            <span>
              {newPupils !== "" && (<>
                {parsedPupils.length} new student{parsedPupils.length > 1 ? "s" : ""} detected: {parsedPupils.join(", ")}
              </>)}
            </span>
          </form>

          <div className={styles.pupilDisplay}>
            <span className={styles.pupilCount}>{pupils.length} students</span>

            <button onClick={handleExportPupils} disabled={pupils.length === 0} className={styles.action}>
              Export students <LuClipboardCopy className={styles.exportIcon}/>
            </button>
          </div>

          <div className={styles.pupilContainer}>
            {pupils.sort().map((pupil: string, index: number) => (
              <PupilCard
                key={index}
                pupil={pupil}
                pupilObject={generatedPlanPupils?.[pupil]}
                onRemove={() => {
                  setPupils(pupils.filter((p, i) => i !== index));
                  setRowConstraints(rowConstraints.filter(c => c.pupil !== pupil));
                  setDistanceConstraints(distanceConstraints.filter(c => c.pupil1 !== pupil && c.pupil2 !== pupil));
                }}
                selfRowConstraint={rowConstraints.find(c => c.pupil === pupil)}
                selfDistanceConstraints={distanceConstraints.filter(c => c.pupil1 === pupil || c.pupil2 === pupil)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.right}>
        <h2>Plategrond Classroom</h2>
        <button
          onClick={handleGenerate}
          className={styles.action}
          disabled={!canGeneratePlan}
        >
          husselen {canGeneratePlan && <FaMagic/>}
        </button>

        <SeatsGrid
          rows={rows}
          columns={columns}
          selectedSeats={selectedSeats}
          planSeats={generatedPlanSeats}
          onClick={handleClick}
          onAddColumn={handleAddColumn}
          onAddRow={handleAddRow}
          onRemoveColumn={handleRemoveColumn}
          onRemoveRow={handleRemoveRow}
        />

        {pupils.length > 0 && (
          <div className={styles.editorContainer}>
            <div className={styles.scotch} />
            <ConstraintsEditor
              pupils={pupils}
              availableRows={availableRows}
              rowConstraints={rowConstraints}
              distanceConstraints={distanceConstraints}
              onAddRowConstraint={handleAddRowConstraint}
              onRemoveRowConstraint={handleRemoveRowConstraint}
              onAddDistanceConstraint={handleAddDistanceConstraint}
              onRemoveDistanceConstraint={handleRemoveDistanceConstraint}
            />
          </div>
        )}
      </section>

    </main>
  )
}
