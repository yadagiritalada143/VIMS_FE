import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsDropdownComponent } from './svms-dropdown.component';

describe('SvmsDropdownComponent', () => {
  let component: SvmsDropdownComponent;
  let fixture: ComponentFixture<SvmsDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SvmsDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
