import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsModalBodyComponent } from './svms-modal-body.component';

describe('SvmsModalBodyComponent', () => {
  let component: SvmsModalBodyComponent;
  let fixture: ComponentFixture<SvmsModalBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsModalBodyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsModalBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
