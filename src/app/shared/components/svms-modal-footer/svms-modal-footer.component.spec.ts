import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsModalFooterComponent } from './svms-modal-footer.component';

describe('SvmsModalFooterComponent', () => {
  let component: SvmsModalFooterComponent;
  let fixture: ComponentFixture<SvmsModalFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsModalFooterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsModalFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
