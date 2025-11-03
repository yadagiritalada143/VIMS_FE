import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsModalComponent } from './svms-modal.component';

describe('SvmsModalComponent', () => {
  let component: SvmsModalComponent;
  let fixture: ComponentFixture<SvmsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
