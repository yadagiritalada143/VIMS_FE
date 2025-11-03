import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { NoProgramComponent } from './no-program.component';

describe('NoProgramComponent', () => {
  let component: NoProgramComponent;
  let fixture: ComponentFixture<NoProgramComponent>;
  CommonTestingModule.setUpTestBed(NoProgramComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ NoProgramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
