/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListSowsComponent } from './sows.component';

describe('ListSowsComponent', () => {
  let component: ListSowsComponent;
  let fixture: ComponentFixture<ListSowsComponent>;
  CommonTestingModule.setUpTestBed(ListSowsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListSowsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListSowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
